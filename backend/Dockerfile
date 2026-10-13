# --- build --------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Resolve dependencies first so they are cached between source changes
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# --- run ----------------------------------------------------------------------
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 leadflow
COPY --from=build /app/target/leadflow-backend.jar app.jar
USER leadflow
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
