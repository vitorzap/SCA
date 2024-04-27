CREATE DATABASE  IF NOT EXISTS `SGA` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `SGA`;
-- MySQL dump 10.13  Distrib 8.0.34, for macos13 (arm64)
--
-- Host: 192.168.0.106    Database: SGA
-- ------------------------------------------------------
-- Server version	8.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Cities`
--

DROP TABLE IF EXISTS `Cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Cities` (
  `ID_City` int NOT NULL AUTO_INCREMENT,
  `ID_State` int NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Cod_State` varchar(2) NOT NULL,
  `Cod_City` varchar(10) NOT NULL,
  PRIMARY KEY (`ID_City`),
  KEY `ID_State` (`ID_State`),
  CONSTRAINT `Cities_ibfk_1` FOREIGN KEY (`ID_State`) REFERENCES `States` (`ID_State`)
) ENGINE=InnoDB AUTO_INCREMENT=5571 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Clients`
--

DROP TABLE IF EXISTS `Clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Clients` (
  `ID_Company` int NOT NULL,
  `ClientID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Name` varchar(80) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `DateOfBirth` date DEFAULT NULL,
  `Gender` enum('Male','Female','Other') DEFAULT NULL,
  `CPF` varchar(11) NOT NULL,
  `Street` varchar(255) DEFAULT NULL,
  `Complement` varchar(255) DEFAULT NULL,
  `District` varchar(100) DEFAULT NULL,
  `ID_City` int NOT NULL,
  `CEP` varchar(20) DEFAULT NULL,
  `RegistrationDate` datetime NOT NULL,
  PRIMARY KEY (`ClientID`),
  UNIQUE KEY `UserID` (`UserID`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `CPF` (`CPF`),
  KEY `ID_Company` (`ID_Company`),
  KEY `ID_City` (`ID_City`),
  CONSTRAINT `Clients_ibfk_1` FOREIGN KEY (`ID_Company`) REFERENCES `Companies` (`ID_Company`),
  CONSTRAINT `Clients_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`),
  CONSTRAINT `Clients_ibfk_3` FOREIGN KEY (`ID_City`) REFERENCES `Cities` (`ID_City`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Companies`
--

DROP TABLE IF EXISTS `Companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Companies` (
  `ID_Company` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY (`ID_Company`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Specialties`
--

DROP TABLE IF EXISTS `Specialties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Specialties` (
  `ID_Company` int NOT NULL,
  `ID_Specialties` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(100) NOT NULL,
  PRIMARY KEY (`ID_Specialties`),
  KEY `ID_Company` (`ID_Company`),
  CONSTRAINT `Specialties_ibfk_1` FOREIGN KEY (`ID_Company`) REFERENCES `Companies` (`ID_Company`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `States`
--

DROP TABLE IF EXISTS `States`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `States` (
  `ID_State` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Acronym` varchar(2) NOT NULL,
  `Cod_State` varchar(2) NOT NULL,
  PRIMARY KEY (`ID_State`),
  UNIQUE KEY `Name` (`Name`),
  UNIQUE KEY `Acronym` (`Acronym`),
  UNIQUE KEY `Cod_State` (`Cod_State`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TeacherSpecialties`
--

DROP TABLE IF EXISTS `TeacherSpecialties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TeacherSpecialties` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ID_Teacher` int NOT NULL,
  `ID_Specialties` int NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `ID_Teacher` (`ID_Teacher`),
  KEY `ID_Specialties` (`ID_Specialties`),
  CONSTRAINT `TeacherSpecialties_ibfk_1` FOREIGN KEY (`ID_Teacher`) REFERENCES `Teachers` (`ID_Teacher`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TeacherSpecialties_ibfk_2` FOREIGN KEY (`ID_Specialties`) REFERENCES `Specialties` (`ID_Specialties`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=175 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Teachers`
--

DROP TABLE IF EXISTS `Teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Teachers` (
  `ID_Company` int NOT NULL,
  `ID_Teacher` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Name` varchar(100) NOT NULL,
  PRIMARY KEY (`ID_Teacher`),
  UNIQUE KEY `UserID` (`UserID`),
  KEY `ID_Company` (`ID_Company`),
  CONSTRAINT `Teachers_ibfk_1` FOREIGN KEY (`ID_Company`) REFERENCES `Companies` (`ID_Company`),
  CONSTRAINT `Teachers_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TimeTableClients`
--

DROP TABLE IF EXISTS `TimeTableClients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TimeTableClients` (
  `ID_TimeTable` int NOT NULL,
  `ClientID` int NOT NULL,
  KEY `ID_TimeTable` (`ID_TimeTable`),
  KEY `ClientID` (`ClientID`),
  CONSTRAINT `TimeTableClients_ibfk_1` FOREIGN KEY (`ID_TimeTable`) REFERENCES `TimeTables` (`ID_TimeTable`),
  CONSTRAINT `TimeTableClients_ibfk_2` FOREIGN KEY (`ClientID`) REFERENCES `Clients` (`ClientID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TimeTables`
--

DROP TABLE IF EXISTS `TimeTables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TimeTables` (
  `ID_TimeTable` int NOT NULL AUTO_INCREMENT,
  `ID_Company` int NOT NULL,
  `ID_Teacher` int NOT NULL,
  `ID_Specialty` int NOT NULL,
  `Day_of_Week` varchar(20) NOT NULL,
  `Start_Time` time NOT NULL,
  `End_Time` time NOT NULL,
  `Capacity` int NOT NULL,
  `Available_Capacity` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID_TimeTable`),
  KEY `ID_Company` (`ID_Company`),
  KEY `ID_Teacher` (`ID_Teacher`),
  KEY `ID_Specialty` (`ID_Specialty`),
  CONSTRAINT `TimeTables_ibfk_1` FOREIGN KEY (`ID_Company`) REFERENCES `Companies` (`ID_Company`),
  CONSTRAINT `TimeTables_ibfk_2` FOREIGN KEY (`ID_Teacher`) REFERENCES `Teachers` (`ID_Teacher`),
  CONSTRAINT `TimeTables_ibfk_3` FOREIGN KEY (`ID_Specialty`) REFERENCES `Specialties` (`ID_Specialties`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `ID_Company` int NOT NULL,
  `UserID` int NOT NULL AUTO_INCREMENT,
  `UserName` varchar(30) NOT NULL,
  `UserEmail` varchar(255) NOT NULL,
  `UserPassword` varchar(255) NOT NULL,
  `UserType` enum('Root','Admin','Teacher','Client') NOT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `UserEmail` (`UserEmail`),
  KEY `ID_Company` (`ID_Company`),
  CONSTRAINT `Users_ibfk_1` FOREIGN KEY (`ID_Company`) REFERENCES `Companies` (`ID_Company`)
) ENGINE=InnoDB AUTO_INCREMENT=248 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-04-17 11:56:51
