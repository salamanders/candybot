package info.benjaminhill

import io.ktor.server.engine.*
import io.ktor.server.cio.*
import info.benjaminhill.plugins.*

fun main() {
    embeddedServer(CIO, port = 8080, host = "0.0.0.0") {
        configureSecurity()
        configureSerialization()
        configureSockets()
        configureRouting()
    }.start(wait = true)
}
