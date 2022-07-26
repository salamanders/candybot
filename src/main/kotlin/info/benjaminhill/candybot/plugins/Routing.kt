package info.benjaminhill.candybot.plugins

import info.benjaminhill.candybot.runMotorA
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.io.File

fun Application.configureRouting() {

    routing {
        static("/") {
            staticBasePackage = "static"
            resource("index.html")
            defaultResource("index.html")
            resources(".")
            /*
            static("assets") {
                resources("modules")
                resources("js")
                resources("css")
            }

             */
        }
        get("/go") {
            call.respondText("Going Medium!")
            runMotorA()
        }
    }
}
