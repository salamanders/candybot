package info.benjaminhill.candybot

import ev3dev.actuators.lego.motors.EV3MediumRegulatedMotor
import io.ktor.network.tls.certificates.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.delay
import lejos.hardware.port.MotorPort
import java.io.File
import java.time.Duration

fun main() {
    val dummyPassword = "changeit";
    val keyStoreFile = File("src/main/resources/keystore.jks")
    val keystore = generateCertificate(
        file = keyStoreFile,
        keyAlias = "ev3dev",
        keyPassword = dummyPassword,
        jksPassword = dummyPassword
    )
    val environment = applicationEngineEnvironment {
        connector {
            port = 8080
        }
        sslConnector(
            keyStore = keystore,
            keyAlias = "ev3dev",
            keyStorePassword = { dummyPassword.toCharArray() },
            privateKeyPassword = { dummyPassword.toCharArray() }) {
            port = 8443
            keyStorePath = keyStoreFile
        }
        module(Application::static)
        module(Application::controls)
        module(Application::webSockets)
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

fun Application.controls() {
    install(ContentNegotiation) {
        json()
    }

    routing {
        get("/go") {
            call.respondText("Going Medium!")
            runMotorA()
        }
        get("/json/kotlinx-serialization") {
            call.respond(mapOf("hello" to "world"))
        }
    }
}

fun Application.webSockets() {
    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(15)
        timeout = Duration.ofSeconds(30)
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }

    routing {
        webSocket("/ws") { // websocketSession
            for (frame in incoming) {
                if (frame is Frame.Text) {
                    val text = frame.readText()
                    // outgoing.send(Frame.Text("ACK ${text.length}"))
                    if (text.equals("bye", ignoreCase = true)) {
                        close(CloseReason(CloseReason.Codes.NORMAL, "Client said BYE"))
                    }
                }
            }
        }
    }
}

suspend fun runMotorA() {
    println("runMotorA")
    val mA = EV3MediumRegulatedMotor(MotorPort.A)
    mA.speed = 500
    mA.brake()
    mA.forward()
    delay(1000)
    mA.stop()
}