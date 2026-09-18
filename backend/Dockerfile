# Etapa 1: Compilación
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copia todos los archivos del proyecto al contenedor
COPY . .

# Compila la aplicación ignorando tests con el Maven de la imagen
RUN mvn clean package -DskipTests

# Etapa 2: Ejecución
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copia el archivo .jar generado en la etapa anterior
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]