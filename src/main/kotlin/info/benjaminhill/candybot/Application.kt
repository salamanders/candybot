package info.benjaminhill.candybot

import ev3dev.actuators.lego.motors.EV3LargeRegulatedMotor
import io.ktor.network.tls.certificates.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import lejos.hardware.port.MotorPort
import lejos.utility.Delay
import java.io.File
import java.net.NetworkInterface
import java.security.KeyStore


const val DUMMY_PASSWORD = "changeme"
const val KEY_ALIAS = "ev3dev"
val KEYSTORE_FILE = File("src/main/resources/keystore.jks")

lateinit var openLidMotor: EV3LargeRegulatedMotor
var isKidBusy = false

fun main() {

    println("Addresses")
    NetworkInterface.getNetworkInterfaces().asSequence()
        .filter { !it.isLoopback }
        .filter { it.isUp }
        .forEach { networkInterface ->
            networkInterface.inetAddresses.asSequence()
                .forEach { addr ->
                    println("  ${networkInterface.displayName} ${addr.hostAddress}")
                }
        }

    if (!KEYSTORE_FILE.canRead()) {
        generateCertificate(
            file = KEYSTORE_FILE,
            keyAlias = KEY_ALIAS,
            keyPassword = DUMMY_PASSWORD,
            jksPassword = DUMMY_PASSWORD
        )
        println("Generated ${KEYSTORE_FILE.absolutePath}")
    }

    val keystore = KeyStore.getInstance(KEYSTORE_FILE, DUMMY_PASSWORD.toCharArray())

    val environment = applicationEngineEnvironment {
        connector {
            port = 8080
        }
        developmentMode = true
        watchPaths = listOf("classes", "resources")
        sslConnector(
            keyStore = keystore,
            keyAlias = KEY_ALIAS,
            keyStorePassword = { DUMMY_PASSWORD.toCharArray() },
            privateKeyPassword = { DUMMY_PASSWORD.toCharArray() }) {
            port = 8443
            keyStorePath = KEYSTORE_FILE
        }
        module(Application::static)
        module(Application::controls)
    }

    embeddedServer(Netty, environment).start(wait = true)
}

fun Application.static() {
    routing {
        static("/") {
            staticBasePackage = "static"
            resource("index.html")
            defaultResource("index.html")
            resources(".")
        }
    }
}

suspend fun doAction(action: String) {
    when (action.lowercase()) {
        "open_hold_close" -> {
            if (isKidBusy) {
                return
            }
            isKidBusy = true
            openLidMotor.rotate(360)
            openLidMotor.hold()
            Delay.msDelay(8_000)
            openLidMotor.rotate(-360)
            openLidMotor.stop()
            isKidBusy = false
        }

        "forward" -> {
            openLidMotor.rotate(180)
            openLidMotor.stop()
        }

        "backward" -> {
            openLidMotor.rotate(-180)
            openLidMotor.stop()
        }

        "float" -> {
            openLidMotor.flt()
        }

        "stop" -> {
            openLidMotor.stop()
        }

        "hold" -> {
            openLidMotor.stop()
        }

        "wait" -> {
            openLidMotor.stop()
        }

        else -> System.err.println("UNKNOWN ACTION `${action}`")
    }
}

@Serializable
data class ActionRequest(
    val action: String
)

fun Application.controls() {
    install(ContentNegotiation) {
        json()
    }

    try {
        openLidMotor = EV3LargeRegulatedMotor(MotorPort.B)
    } catch (e: Exception) {
        println("No real motor")
    }

    routing {
        post("/motor") {
            val moveRequest = call.receive<ActionRequest>()
            println("/move $moveRequest")
            call.respond(
                mapOf(
                    "status" to "ack",
                    "action" to moveRequest.action
                )
            )
            openLidMotor.speed = openLidMotor.maxSpeed.toInt()
            launch {
                doAction(moveRequest.action)
            }
        }
    }
}
