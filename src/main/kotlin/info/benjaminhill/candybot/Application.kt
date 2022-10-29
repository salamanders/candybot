package info.benjaminhill.candybot

import ev3dev.actuators.lego.motors.EV3LargeRegulatedMotor
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import lejos.hardware.port.MotorPort
import java.io.*
import java.security.KeyStore


const val DUMMY_PASSWORD = "changeme"
const val KEY_ALIAS = "ev3dev"
 val KEYSTORE_FILE = File("src/main/resources/keystore.jks")

fun main() {
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
data class MoveRequest(
    val action: String
)

fun Application.controls() {
    install(ContentNegotiation) {
        json()
    }

    routing {
        post("/move") {
            val moveRequest = call.receive<MoveRequest>()
            println("Got a MoveRequest:${moveRequest}")
            call.respond(
                mapOf(
                    "status" to "ack",
                    "action" to moveRequest.action
                )
            )
            val openLidMotor = EV3LargeRegulatedMotor(MotorPort.B)
            openLidMotor.speed = openLidMotor.maxSpeed.toInt()
            when (moveRequest.action) {
                "forward" -> openLidMotor.forward()
                "backward" -> openLidMotor.backward()
                "stop" -> openLidMotor.stop()
                else -> println("Unknown action `${moveRequest.action}`")
            }
        }
    }
}
