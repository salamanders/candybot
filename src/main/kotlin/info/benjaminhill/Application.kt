package info.benjaminhill

import info.benjaminhill.plugins.configureRouting
import info.benjaminhill.plugins.configureSecurity
import info.benjaminhill.plugins.configureSerialization
import info.benjaminhill.plugins.configureSockets
import io.ktor.server.cio.*
import io.ktor.server.engine.*

fun main() {
    embeddedServer(CIO, port = 8080, host = "0.0.0.0") {
        configureSecurity()
        configureSerialization()
        configureSockets()
        configureRouting()
    }.start(wait = true)
}
