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
import java.net.NetworkInterface

val leftSpool: EV3LargeRegulatedMotor by lazy {
    EV3LargeRegulatedMotor(MotorPort.B).apply {
        speed = maxSpeed.toInt()
    }
}
val rightSpool: EV3LargeRegulatedMotor by lazy {
    EV3LargeRegulatedMotor(MotorPort.C).apply {
        speed = maxSpeed.toInt()
    }
}
const val rotationMultiplier = .5
fun main() {

    println("Addresses")
    NetworkInterface.getNetworkInterfaces().asSequence()
        .filter { !it.isLoopback }
        .filter { it.isUp }
        .forEach { networkInterface ->
            networkInterface.inetAddresses.asSequence()
                .forEach { addr ->
                    println("  ${networkInterface.displayName} ${addr.hostAddress}")
                    if (addr.hostAddress.startsWith("192")) {
                        println("http://${addr.hostAddress}:8080")
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

fun rotateMotors(leftSpoolDir: Int, rightSpoolDir: Int) {
    leftSpool.rotate((leftSpoolDir * 360 * rotationMultiplier).toInt(), true)
    rightSpool.rotate((rightSpoolDir * 360 * rotationMultiplier).toInt(), true)
    leftSpool.waitComplete()
    rightSpool.waitComplete()
}

fun doAction(action: String) {
    // positive is let out, negative is retract
    when (action.lowercase()) {
        "up_left" -> rotateMotors(-1, 0)
        "up_middle" -> rotateMotors(-1, -1)
        "up_right" -> rotateMotors(0, -1)
        "center_left" -> rotateMotors(-1, 1)
        "center_middle" -> {
            leftSpool.flt()
            rightSpool.flt()
        }

        "center_right" -> rotateMotors(1, -1)
        "down_left" -> rotateMotors(0, 1)
        "down_middle" -> rotateMotors(1, 1)
        "down_right" -> rotateMotors(1, 0)
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

    routing {
        post("/motor") {
            val moveRequest = call.receive<ActionRequest>()
            println("/move $moveRequest")
            doAction(moveRequest.action)
            // Wait to respond intentionally
            call.respond(
                mapOf(
                    "status" to "ack",
                    "action" to moveRequest.action
                )
            )
        }
    }
}
