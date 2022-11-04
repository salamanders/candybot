
plugins {
    application
    kotlin("jvm") version "1.7.20"
    id("org.jetbrains.kotlin.plugin.serialization") version "1.7.20"
}

group = "info.benjaminhill"
version = "0.0.1"
application {
    mainClass.set("info.benjaminhill.candybot.ApplicationKt")

    val isDevelopment: Boolean = project.ext.has("development")
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=$isDevelopment")
}

repositories {
    mavenCentral()
    maven { setUrl("https://jitpack.io") }
}

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:2.1.3")
    implementation("io.ktor:ktor-server-sessions-jvm:2.1.3")
    implementation("io.ktor:ktor-server-host-common-jvm:2.1.3")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:2.1.3")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:2.1.3")
    implementation("io.ktor:ktor-server-websockets-jvm:2.1.3")
    implementation("ch.qos.logback:logback-classic:1.4.4")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.6.4")

    implementation("com.github.jaakkos:ev3dev-lang-java:a379a53500")
    implementation("io.ktor:ktor-server-netty-jvm:2.1.3")
    implementation("io.ktor:ktor-network-tls-certificates-jvm:2.1.3")
}