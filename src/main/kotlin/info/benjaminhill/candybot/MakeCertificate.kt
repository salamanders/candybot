package info.benjaminhill.candybot

import io.ktor.network.tls.certificates.*
import java.io.File

fun main() {
    val keyStoreFile = File("build/keystore.jks")
    generateCertificate(
        file = keyStoreFile,
        keyAlias = KEY_ALIAS,
        keyPassword = DUMMY_PASSWORD,
        jksPassword = DUMMY_PASSWORD
    )
}
