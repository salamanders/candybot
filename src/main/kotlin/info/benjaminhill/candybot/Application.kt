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
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import lejos.hardware.port.MotorPort
import java.net.NetworkInterface

lateinit var leftSpool: EV3LargeRegulatedMotor
lateinit var rightSpool: EV3LargeRegulatedMotor
const val rotationMultiplier = 3
lateinit var IPv4:String
fun main() {

    println("Addresses")
    NetworkInterface.getNetworkInterfaces().asSequence()
        .filter { !it.isLoopback }
        .filter { it.isUp }
        .forEach { networkInterface ->
            networkInterface.inetAddresses.asSequence()
                .forEach { addr ->
                    println("  ${networkInterface.displayName} ${addr.hostAddress}")
                    if(addr.hostAddress.startsWith("192")) {
                        IPv4 = addr.hostAddress
                    }
                }
        }

    val environment = applicationEngineEnvironment {
        connector {
            port = 8080
        }
        developmentMode = true
        watchPaths = listOf("classes", "resources")
        module(Application::static)
        module(Application::controls)
    }

    println("http://${IPv4}:8080")
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

fun doAction(action: String) {
    when (action.lowercase()) {
        "forward_l" -> {
            if (!leftSpool.isMoving) {
                leftSpool.rotate(360 * rotationMultiplier)
                leftSpool.hold()
            }
        }
        "forward_r" -> {
            if (!rightSpool.isMoving) {
                rightSpool.rotate(360 * rotationMultiplier)
                rightSpool.hold()
            }
        }
        "backward_l" -> {
            if (!leftSpool.isMoving) {
                leftSpool.rotate(-360 * rotationMultiplier)
                leftSpool.hold()
            }
        }
        "backward_r" -> {
            if (!rightSpool.isMoving) {
                rightSpool.rotate(-360 * rotationMultiplier)
                rightSpool.hold()
            }
        }
        "float" -> {
            leftSpool.flt()
            rightSpool.flt()
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
        leftSpool = EV3LargeRegulatedMotor(MotorPort.B).apply {
            speed = maxSpeed.toInt()
        }
        rightSpool = EV3LargeRegulatedMotor(MotorPort.C).apply {
            speed = maxSpeed.toInt()
        }
    } catch (e: Exception) {
        println("No real motor, $e")
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
            launch {
                doAction(moveRequest.action)
            }
        }
    }
}
