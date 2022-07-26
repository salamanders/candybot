package info.benjaminhill.candybot

import ev3dev.actuators.lego.motors.EV3LargeRegulatedMotor
import ev3dev.actuators.lego.motors.EV3MediumRegulatedMotor
import info.benjaminhill.candybot.plugins.configureRouting
import info.benjaminhill.candybot.plugins.configureSecurity
import info.benjaminhill.candybot.plugins.configureSerialization
import info.benjaminhill.candybot.plugins.configureSockets
import io.ktor.server.cio.*
import io.ktor.server.engine.*
import kotlinx.coroutines.delay
import lejos.hardware.port.MotorPort

fun main() {
    embeddedServer(CIO, port = 8080, host = "0.0.0.0") {
        configureSecurity()
        configureSerialization()
        configureSockets()
        configureRouting()
    }.start(wait = true)
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