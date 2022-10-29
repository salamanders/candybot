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
import io.ktor.util.*
import kotlinx.serialization.Serializable
import lejos.hardware.port.MotorPort
import lejos.robotics.BaseMotor
import lejos.robotics.RegulatedMotor
import java.io.File
import java.net.NetworkInterface
import java.security.KeyStore
import java.util.*
import kotlin.concurrent.schedule
import kotlin.text.toCharArray


const val DUMMY_PASSWORD = "changeme"
const val KEY_ALIAS = "ev3dev"
val KEYSTORE_FILE = File("src/main/resources/keystore.jks")

lateinit var openLidMotor: RegulatedMotor
var isBusy = false

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

@Serializable
enum class MotorActions(
    val exec: (motor: BaseMotor) -> Unit
) {
    OPEN_HOLD_CLOSE(exec = { motor ->
        if (!isBusy) {
            isBusy = true
            mapOf(
                0L to { motor.forward() },
                2_000L to { motor.stop() },
                7_000L to { motor.backward() },
                9_000L to {
                    motor.stop()
                    isBusy = false
                })
                .forEach { (delay, action) ->
                    Timer().schedule(delay) {
                        action()
                    }
                }
        }

    }),
    FORWARD(exec = { motor ->
        motor.forward()
        Timer().schedule(1_000) {
            motor.stop()
        }
    }),
    BACKWARD(exec = { motor ->
        motor.backward()
        Timer().schedule(1_000) {
            motor.stop()
        }
    }),
    STOP(exec = { motor ->
        motor.stop()
    }),
    FLOAT(exec = { motor ->
        motor.flt()
    });
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
        post("/move") {
            val moveRequest = call.receive<ActionRequest>()
            println("/move $moveRequest")
            call.respond(
                mapOf(
                    "status" to "ack",
                    "action" to moveRequest.action
                )
            )
            openLidMotor.speed = openLidMotor.maxSpeed.toInt()
            MotorActions.valueOf(moveRequest.action.toUpperCasePreservingASCIIRules()).exec(openLidMotor)
        }

        post("/remote") {
            val remoteAction = call.receive<ActionRequest>()
            println("/remote $remoteAction")
            isBusy = true
            Timer().schedule(10_000) {
                isBusy = false
            }
            call.respond(
                mapOf(
                    "status" to "ack",
                    "action" to remoteAction.action
                )
            )
            openLidMotor.speed = (openLidMotor.maxSpeed * 0.5).toInt()
            MotorActions.valueOf(remoteAction.action.toUpperCasePreservingASCIIRules()).exec(openLidMotor)
        }
    }
}
