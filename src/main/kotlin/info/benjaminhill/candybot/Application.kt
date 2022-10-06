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
import kotlinx.coroutines.delay
import lejos.hardware.port.MotorPort
import java.io.File

fun main() {
    val dummyPassword = "changeit"
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
        developmentMode = true
        watchPaths = listOf("classes", "resources")
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
        post("/move") {
            call.respond(mapOf("status" to "ok"))
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