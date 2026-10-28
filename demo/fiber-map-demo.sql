-- fiber-map synthetic demo data. No real customer records.
-- Import into a fresh database, then run `python run.py` once so the
-- launcher applies the remaining migrations and map defaults.
-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: fiber_map (synthetic demo data)
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add cable',6,'add_cable'),(22,'Can change cable',6,'change_cable'),(23,'Can delete cable',6,'delete_cable'),(24,'Can view cable',6,'view_cable'),(25,'Can add marker',7,'add_marker'),(26,'Can change marker',7,'change_marker'),(27,'Can delete marker',7,'delete_marker'),(28,'Can view marker',7,'view_marker'),(29,'Can add user',8,'add_userprofile'),(30,'Can change user',8,'change_userprofile'),(31,'Can delete user',8,'delete_userprofile'),(32,'Can view user',8,'view_userprofile'),(33,'Can add core',9,'add_core'),(34,'Can change core',9,'change_core'),(35,'Can delete core',9,'delete_core'),(36,'Can view core',9,'view_core'),(37,'Can add connection',10,'add_connection'),(38,'Can change connection',10,'change_connection'),(39,'Can delete connection',10,'delete_connection'),(40,'Can view connection',10,'view_connection'),(41,'Can add gpon',11,'add_gpon'),(42,'Can change gpon',11,'change_gpon'),(43,'Can delete gpon',11,'delete_gpon'),(44,'Can view gpon',11,'view_gpon'),(45,'Can add client',12,'add_client'),(46,'Can change client',12,'change_client'),(47,'Can delete client',12,'delete_client'),(48,'Can view client',12,'view_client'),(49,'Can add pop',13,'add_pop'),(50,'Can change pop',13,'change_pop'),(51,'Can delete pop',13,'delete_pop'),(52,'Can view pop',13,'view_pop'),(53,'Can add reseller',14,'add_reseller'),(54,'Can change reseller',14,'change_reseller'),(55,'Can delete reseller',14,'delete_reseller'),(56,'Can view reseller',14,'view_reseller'),(57,'Can add tj box',15,'add_tjbox'),(58,'Can change tj box',15,'change_tjbox'),(59,'Can delete tj box',15,'delete_tjbox'),(60,'Can view tj box',15,'view_tjbox'),(61,'Can add zone',16,'add_zone'),(62,'Can change zone',16,'change_zone'),(63,'Can delete zone',16,'delete_zone'),(64,'Can view zone',16,'view_zone'),(65,'Can add Manager User',17,'add_manageruser'),(66,'Can change Manager User',17,'change_manageruser'),(67,'Can delete Manager User',17,'delete_manageruser'),(68,'Can view Manager User',17,'view_manageruser'),(69,'Can add sub zone',18,'add_subzone'),(70,'Can change sub zone',18,'change_subzone'),(71,'Can delete sub zone',18,'delete_subzone'),(72,'Can view sub zone',18,'view_subzone'),(73,'Can add Site settings',19,'add_sitesettings'),(74,'Can change Site settings',19,'change_sitesettings'),(75,'Can delete Site settings',19,'delete_sitesettings'),(76,'Can view Site settings',19,'view_sitesettings'),(77,'Can add Network category',20,'add_networkcategory'),(78,'Can change Network category',20,'change_networkcategory'),(79,'Can delete Network category',20,'delete_networkcategory'),(80,'Can view Network category',20,'view_networkcategory'),(81,'Can add Custom network point',21,'add_customnetworkpoint'),(82,'Can change Custom network point',21,'change_customnetworkpoint'),(83,'Can delete Custom network point',21,'delete_customnetworkpoint'),(84,'Can view Custom network point',21,'view_customnetworkpoint'),(85,'Can add Token',22,'add_token'),(86,'Can change Token',22,'change_token'),(87,'Can delete Token',22,'delete_token'),(88,'Can view Token',22,'view_token'),(89,'Can add token',23,'add_tokenproxy'),(90,'Can change token',23,'change_tokenproxy'),(91,'Can delete token',23,'delete_tokenproxy'),(92,'Can view token',23,'view_tokenproxy');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authtoken_token`
--

DROP TABLE IF EXISTS `authtoken_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `authtoken_token` (
  `key` varchar(40) NOT NULL,
  `created` datetime(6) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY (`key`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `authtoken_token_user_id_35299eff_fk_map_userprofile_id` FOREIGN KEY (`user_id`) REFERENCES `map_userprofile` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authtoken_token`
--

LOCK TABLES `authtoken_token` WRITE;
/*!40000 ALTER TABLE `authtoken_token` DISABLE KEYS */;
/*!40000 ALTER TABLE `authtoken_token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext DEFAULT NULL,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) unsigned NOT NULL CHECK (`action_flag` >= 0),
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_map_userprofile_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_map_userprofile_id` FOREIGN KEY (`user_id`) REFERENCES `map_userprofile` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(22,'authtoken','token'),(23,'authtoken','tokenproxy'),(4,'contenttypes','contenttype'),(6,'map','cable'),(12,'map','client'),(10,'map','connection'),(9,'map','core'),(21,'map','customnetworkpoint'),(11,'map','gpon'),(17,'map','manageruser'),(7,'map','marker'),(20,'map','networkcategory'),(13,'map','pop'),(14,'map','reseller'),(19,'map','sitesettings'),(18,'map','subzone'),(15,'map','tjbox'),(8,'map','userprofile'),(16,'map','zone'),(5,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_migrations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-10-27 03:54:12.617203'),(2,'contenttypes','0002_remove_content_type_name','2026-10-27 03:54:12.678198'),(3,'auth','0001_initial','2026-10-27 03:54:12.948427'),(4,'auth','0002_alter_permission_name_max_length','2026-10-27 03:54:13.003114'),(5,'auth','0003_alter_user_email_max_length','2026-10-27 03:54:13.010522'),(6,'auth','0004_alter_user_username_opts','2026-10-27 03:54:13.024010'),(7,'auth','0005_alter_user_last_login_null','2026-10-27 03:54:13.032495'),(8,'auth','0006_require_contenttypes_0002','2026-10-27 03:54:13.034841'),(9,'auth','0007_alter_validators_add_error_messages','2026-10-27 03:54:13.043100'),(10,'auth','0008_alter_user_username_max_length','2026-10-27 03:54:13.050613'),(11,'auth','0009_alter_user_last_name_max_length','2026-10-27 03:54:13.063662'),(12,'auth','0010_alter_group_name_max_length','2026-10-27 03:54:13.085074'),(13,'auth','0011_update_proxy_permissions','2026-10-27 03:54:13.095983'),(14,'auth','0012_alter_user_first_name_max_length','2026-10-27 03:54:13.105206'),(15,'map','0001_initial','2026-10-27 03:54:14.591639'),(16,'admin','0001_initial','2026-10-27 03:54:14.756440'),(17,'admin','0002_logentry_remove_auto_add','2026-10-27 03:54:14.769902'),(18,'admin','0003_logentry_add_action_flag_choices','2026-10-27 03:54:14.783311'),(19,'authtoken','0001_initial','2026-10-27 03:54:14.887828'),(20,'authtoken','0002_auto_20160226_1747','2026-10-27 03:54:14.933619'),(21,'authtoken','0003_tokenproxy','2026-10-27 03:54:14.936904'),(22,'map','0002_zone_manageruser_userprofile_is_manager_and_more','2026-10-27 03:54:15.105301'),(23,'map','0003_cable_subzone_cable_zone_client_subzone_client_zone_and_more','2026-10-27 03:54:16.432813'),(24,'map','0004_sitesettings_userprofile_can_add_data_and_more','2026-10-27 03:54:16.672111'),(25,'map','0005_networkcategory_customnetworkpoint','2026-10-27 03:54:17.103149'),(26,'map','0006_seed_network_categories','2026-10-27 03:54:17.331783'),(27,'map','0007_sitesettings_gps_max_distance_km_and_more','2026-10-27 03:54:17.522029'),(28,'map','0008_pop_type_free_text','2026-10-27 03:54:17.575116'),(29,'sessions','0001_initial','2026-10-27 03:54:17.660875');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_cable`
--

DROP TABLE IF EXISTS `map_cable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_cable` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `start_from` varchar(100) NOT NULL,
  `end_to` varchar(100) NOT NULL,
  `number_of_cores` int(11) NOT NULL,
  `length` double DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `polyline` longtext DEFAULT NULL,
  `ending_point_id` bigint(20) NOT NULL,
  `starting_point_id` bigint(20) NOT NULL,
  `subzone_id` bigint(20) DEFAULT NULL,
  `zone_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `map_cable_ending_point_id_bd56b00f_fk_map_marker_id` (`ending_point_id`),
  KEY `map_cable_starting_point_id_ff7dca29_fk_map_marker_id` (`starting_point_id`),
  KEY `map_cable_subzone_id_be765f2d_fk_map_subzone_id` (`subzone_id`),
  KEY `map_cable_zone_id_0dc399b4_fk_map_zone_id` (`zone_id`),
  CONSTRAINT `map_cable_ending_point_id_bd56b00f_fk_map_marker_id` FOREIGN KEY (`ending_point_id`) REFERENCES `map_marker` (`id`),
  CONSTRAINT `map_cable_starting_point_id_ff7dca29_fk_map_marker_id` FOREIGN KEY (`starting_point_id`) REFERENCES `map_marker` (`id`),
  CONSTRAINT `map_cable_subzone_id_be765f2d_fk_map_subzone_id` FOREIGN KEY (`subzone_id`) REFERENCES `map_subzone` (`id`),
  CONSTRAINT `map_cable_zone_id_0dc399b4_fk_map_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `map_zone` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_cable`
--

LOCK TABLES `map_cable` WRITE;
/*!40000 ALTER TABLE `map_cable` DISABLE KEYS */;
INSERT INTO `map_cable` VALUES (1,'DEMO-CABLE-001','FIBER','POP','TJ_BOX',4,0.35,'Fictional demo cable.','Demo fiber cable from POP to TJ Box.','[{\"lat\": 23.7925, \"lng\": 90.4078}, {\"lat\": 23.793, \"lng\": 90.4082}, {\"lat\": 23.7942, \"lng\": 90.4091}]',4,1,1,1),(2,'DEMO-CABLE-002','FIBER','POP','TJ_BOX',6,0.45,'Fictional demo cable.','Demo fiber cable from POP to TJ Box.','[{\"lat\": 22.3269, \"lng\": 91.8317}, {\"lat\": 22.333, \"lng\": 91.824}, {\"lat\": 22.34, \"lng\": 91.815}, {\"lat\": 22.3687, \"lng\": 91.7986}]',6,3,4,2);
/*!40000 ALTER TABLE `map_cable` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_client`
--

DROP TABLE IF EXISTS `map_client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_client` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `mobile_number` varchar(100) DEFAULT NULL,
  `marker_id` bigint(20) NOT NULL,
  `subzone_id` bigint(20) DEFAULT NULL,
  `zone_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `marker_id` (`marker_id`),
  KEY `map_client_subzone_id_732e1420_fk_map_subzone_id` (`subzone_id`),
  KEY `map_client_zone_id_f64a65c4_fk_map_zone_id` (`zone_id`),
  CONSTRAINT `map_client_marker_id_a667b8d2_fk_map_marker_id` FOREIGN KEY (`marker_id`) REFERENCES `map_marker` (`id`),
  CONSTRAINT `map_client_subzone_id_732e1420_fk_map_subzone_id` FOREIGN KEY (`subzone_id`) REFERENCES `map_subzone` (`id`),
  CONSTRAINT `map_client_zone_id_f64a65c4_fk_map_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `map_zone` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_client`
--

LOCK TABLES `map_client` WRITE;
/*!40000 ALTER TABLE `map_client` DISABLE KEYS */;
INSERT INTO `map_client` VALUES (1,'DEMO-CLIENT-001','Demo Client 1','01700000001',7,1,1),(2,'DEMO-CLIENT-002','Demo Client 2','01700000002',8,1,1),(3,'DEMO-CLIENT-003','Demo Client 3','01700000003',9,2,1),(4,'DEMO-CLIENT-004','Demo Client 4','01700000004',10,3,2),(5,'DEMO-CLIENT-005','Demo Client 5','01700000005',11,4,2);
/*!40000 ALTER TABLE `map_client` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_connection`
--

DROP TABLE IF EXISTS `map_connection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_connection` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `core_from_id` bigint(20) NOT NULL,
  `core_to_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `map_connection_core_from_id_6abb8c1f_fk_map_core_id` (`core_from_id`),
  KEY `map_connection_core_to_id_03378b8d_fk_map_core_id` (`core_to_id`),
  CONSTRAINT `map_connection_core_from_id_6abb8c1f_fk_map_core_id` FOREIGN KEY (`core_from_id`) REFERENCES `map_core` (`id`),
  CONSTRAINT `map_connection_core_to_id_03378b8d_fk_map_core_id` FOREIGN KEY (`core_to_id`) REFERENCES `map_core` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_connection`
--

LOCK TABLES `map_connection` WRITE;
/*!40000 ALTER TABLE `map_connection` DISABLE KEYS */;
/*!40000 ALTER TABLE `map_connection` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_core`
--

DROP TABLE IF EXISTS `map_core`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_core` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `core_number` int(11) NOT NULL,
  `color` varchar(100) NOT NULL,
  `assigned` tinyint(1) NOT NULL,
  `cable_id` bigint(20) DEFAULT NULL,
  `splitter_id` bigint(20) DEFAULT NULL,
  `marker_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `map_core_splitter_id_5c8af8a9_fk_map_gpon_id` (`splitter_id`),
  KEY `map_core_marker_id_19f60369_fk_map_marker_id` (`marker_id`),
  KEY `map_core_cable_id_9ba1e7d8_fk_map_cable_id` (`cable_id`),
  CONSTRAINT `map_core_cable_id_9ba1e7d8_fk_map_cable_id` FOREIGN KEY (`cable_id`) REFERENCES `map_cable` (`id`),
  CONSTRAINT `map_core_marker_id_19f60369_fk_map_marker_id` FOREIGN KEY (`marker_id`) REFERENCES `map_marker` (`id`),
  CONSTRAINT `map_core_splitter_id_5c8af8a9_fk_map_gpon_id` FOREIGN KEY (`splitter_id`) REFERENCES `map_gpon` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_core`
--

LOCK TABLES `map_core` WRITE;
/*!40000 ALTER TABLE `map_core` DISABLE KEYS */;
/*!40000 ALTER TABLE `map_core` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_customnetworkpoint`
--

DROP TABLE IF EXISTS `map_customnetworkpoint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_customnetworkpoint` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `mobile_number` varchar(100) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `subzone_id` bigint(20) DEFAULT NULL,
  `zone_id` bigint(20) DEFAULT NULL,
  `category_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `map_customnetworkpoint_subzone_id_8519c837_fk_map_subzone_id` (`subzone_id`),
  KEY `map_customnetworkpoint_zone_id_da7c3c2d_fk_map_zone_id` (`zone_id`),
  KEY `map_customnetworkpoi_category_id_6df0cae5_fk_map_netwo` (`category_id`),
  CONSTRAINT `map_customnetworkpoi_category_id_6df0cae5_fk_map_netwo` FOREIGN KEY (`category_id`) REFERENCES `map_networkcategory` (`id`),
  CONSTRAINT `map_customnetworkpoint_subzone_id_8519c837_fk_map_subzone_id` FOREIGN KEY (`subzone_id`) REFERENCES `map_subzone` (`id`),
  CONSTRAINT `map_customnetworkpoint_zone_id_da7c3c2d_fk_map_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `map_zone` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_customnetworkpoint`
--

LOCK TABLES `map_customnetworkpoint` WRITE;
/*!40000 ALTER TABLE `map_customnetworkpoint` DISABLE KEYS */;
INSERT INTO `map_customnetworkpoint` VALUES (1,'DEMO-CAM-001','Demo Camera 1','01700000021','Demo camera address, Gulshan','Fictional sample camera.','Demo custom-category record.',23.7934,90.4098,'2026-10-27 03:54:28.304154','2026-10-27 03:54:28.304154',1,1,5),(2,'DEMO-CAM-002','Demo Camera 2','01700000022','Demo camera address, Agrabad','Fictional sample camera.','Demo custom-category record.',22.3272,91.8331,'2026-10-27 03:54:28.308148','2026-10-27 03:54:28.308148',3,2,5);
/*!40000 ALTER TABLE `map_customnetworkpoint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_gpon`
--

DROP TABLE IF EXISTS `map_gpon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_gpon` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `splitter` int(11) NOT NULL,
  `input_cable_id` bigint(20) DEFAULT NULL,
  `input_core_id` bigint(20) DEFAULT NULL,
  `marker_id` bigint(20) NOT NULL,
  `tj_box_id` bigint(20) DEFAULT NULL,
  `subzone_id` bigint(20) DEFAULT NULL,
  `zone_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `map_gpon_tj_box_id_8860f4ae_fk_map_tjbox_id` (`tj_box_id`),
  KEY `map_gpon_input_cable_id_7644f3a3_fk_map_cable_id` (`input_cable_id`),
  KEY `map_gpon_input_core_id_e0254cc5_fk_map_core_id` (`input_core_id`),
  KEY `map_gpon_marker_id_c129dd68_fk_map_marker_id` (`marker_id`),
  KEY `map_gpon_subzone_id_a8688e04_fk_map_subzone_id` (`subzone_id`),
  KEY `map_gpon_zone_id_a7bffe88_fk_map_zone_id` (`zone_id`),
  CONSTRAINT `map_gpon_input_cable_id_7644f3a3_fk_map_cable_id` FOREIGN KEY (`input_cable_id`) REFERENCES `map_cable` (`id`),
  CONSTRAINT `map_gpon_input_core_id_e0254cc5_fk_map_core_id` FOREIGN KEY (`input_core_id`) REFERENCES `map_core` (`id`),
  CONSTRAINT `map_gpon_marker_id_c129dd68_fk_map_marker_id` FOREIGN KEY (`marker_id`) REFERENCES `map_marker` (`id`),
  CONSTRAINT `map_gpon_subzone_id_a8688e04_fk_map_subzone_id` FOREIGN KEY (`subzone_id`) REFERENCES `map_subzone` (`id`),
  CONSTRAINT `map_gpon_tj_box_id_8860f4ae_fk_map_tjbox_id` FOREIGN KEY (`tj_box_id`) REFERENCES `map_tjbox` (`id`),
  CONSTRAINT `map_gpon_zone_id_a7bffe88_fk_map_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `map_zone` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_gpon`
--

LOCK TABLES `map_gpon` WRITE;
/*!40000 ALTER TABLE `map_gpon` DISABLE KEYS */;
/*!40000 ALTER TABLE `map_gpon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_marker`
--

DROP TABLE IF EXISTS `map_marker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_marker` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) DEFAULT NULL,
  `type` varchar(100) NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `address` varchar(200) DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_marker`
--

LOCK TABLES `map_marker` WRITE;
/*!40000 ALTER TABLE `map_marker` DISABLE KEYS */;
INSERT INTO `map_marker` VALUES (1,'DEMO-POP-001','POP',23.7925,90.4078,'Demo address, Gulshan, Dhaka','This is fictional sample data.','Demo record for the open-source sample database.'),(2,'DEMO-POP-002','POP',23.8069,90.3687,'Demo address, Mirpur, Dhaka','This is fictional sample data.','Demo record for the open-source sample database.'),(3,'DEMO-POP-003','POP',22.3269,91.8317,'Demo address, Agrabad, Chattogram','This is fictional sample data.','Demo record for the open-source sample database.'),(4,'DEMO-TJ-001','TJ_BOX',23.7942,90.4091,'Demo TJ address, Gulshan','This is fictional sample data.','Demo record for the open-source sample database.'),(5,'DEMO-TJ-002','TJ_BOX',23.8081,90.3699,'Demo TJ address, Mirpur','This is fictional sample data.','Demo record for the open-source sample database.'),(6,'DEMO-TJ-003','TJ_BOX',22.3687,91.7986,'Demo TJ address, Pahartali','This is fictional sample data.','Demo record for the open-source sample database.'),(7,'DEMO-CLIENT-001','CLIENT',23.7931,90.4084,'Demo road 1, Gulshan','This is fictional sample data.','Demo record for the open-source sample database.'),(8,'DEMO-CLIENT-002','CLIENT',23.7938,90.4069,'Demo road 2, Gulshan','This is fictional sample data.','Demo record for the open-source sample database.'),(9,'DEMO-CLIENT-003','CLIENT',23.8074,90.3681,'Demo road 3, Mirpur','This is fictional sample data.','Demo record for the open-source sample database.'),(10,'DEMO-CLIENT-004','CLIENT',22.3277,91.8325,'Demo road 4, Agrabad','This is fictional sample data.','Demo record for the open-source sample database.'),(11,'DEMO-CLIENT-005','CLIENT',22.3671,91.7974,'Demo road 5, Pahartali','This is fictional sample data.','Demo record for the open-source sample database.'),(12,'DEMO-RESELLER-001','RESELLER',23.7919,90.407,'Demo reseller address, Gulshan','This is fictional sample data.','Demo record for the open-source sample database.');
/*!40000 ALTER TABLE `map_marker` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_networkcategory`
--

DROP TABLE IF EXISTS `map_networkcategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_networkcategory` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `key` varchar(64) NOT NULL,
  `label` varchar(80) NOT NULL,
  `icon` varchar(40) NOT NULL,
  `color` varchar(20) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL,
  `sort_order` int(10) unsigned NOT NULL CHECK (`sort_order` >= 0),
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_networkcategory`
--

LOCK TABLES `map_networkcategory` WRITE;
/*!40000 ALTER TABLE `map_networkcategory` DISABLE KEYS */;
INSERT INTO `map_networkcategory` VALUES (1,'POP','POP','building','#2563eb',NULL,1,10,'2026-10-27 03:54:17.221941','2026-10-27 03:54:17.221941'),(2,'CLIENT','Client','user','#16a34a',NULL,1,20,'2026-10-27 03:54:17.253188','2026-10-27 03:54:17.253188'),(3,'TJ_BOX','TJ Box','inbox','#f59e0b',NULL,1,30,'2026-10-27 03:54:17.286015','2026-10-27 03:54:17.286015'),(4,'RESELLER','Reseller','shop','#9333ea',NULL,1,40,'2026-10-27 03:54:17.309246','2026-10-27 03:54:17.309246'),(5,'camera','Camera','camera','#0ea5e9','Demo CCTV camera points',0,50,'2026-10-27 03:54:28.299049','2026-10-27 03:54:28.299049');
/*!40000 ALTER TABLE `map_networkcategory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_pop`
--

DROP TABLE IF EXISTS `map_pop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_pop` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `pop_type` varchar(100) NOT NULL,
  `marker_id` bigint(20) NOT NULL,
  `subzone_id` bigint(20) DEFAULT NULL,
  `zone_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `marker_id` (`marker_id`),
  KEY `map_pop_subzone_id_f2878438_fk_map_subzone_id` (`subzone_id`),
  KEY `map_pop_zone_id_52188303_fk_map_zone_id` (`zone_id`),
  CONSTRAINT `map_pop_marker_id_9563816b_fk_map_marker_id` FOREIGN KEY (`marker_id`) REFERENCES `map_marker` (`id`),
  CONSTRAINT `map_pop_subzone_id_f2878438_fk_map_subzone_id` FOREIGN KEY (`subzone_id`) REFERENCES `map_subzone` (`id`),
  CONSTRAINT `map_pop_zone_id_52188303_fk_map_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `map_zone` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_pop`
--

LOCK TABLES `map_pop` WRITE;
/*!40000 ALTER TABLE `map_pop` DISABLE KEYS */;
INSERT INTO `map_pop` VALUES (1,'DEMO-POP-001','Demo POP Gulshan','OLT',1,1,1),(2,'DEMO-POP-002','Demo POP Mirpur','ONU',2,2,1),(3,'DEMO-POP-003','Demo POP Agrabad','OLT',3,3,2);
/*!40000 ALTER TABLE `map_pop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_reseller`
--

DROP TABLE IF EXISTS `map_reseller`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_reseller` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `mobile_number` varchar(100) DEFAULT NULL,
  `marker_id` bigint(20) NOT NULL,
  `subzone_id` bigint(20) DEFAULT NULL,
  `zone_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `marker_id` (`marker_id`),
  KEY `map_reseller_subzone_id_20e32b94_fk_map_subzone_id` (`subzone_id`),
  KEY `map_reseller_zone_id_e05e0709_fk_map_zone_id` (`zone_id`),
  CONSTRAINT `map_reseller_marker_id_11f2ca3b_fk_map_marker_id` FOREIGN KEY (`marker_id`) REFERENCES `map_marker` (`id`),
  CONSTRAINT `map_reseller_subzone_id_20e32b94_fk_map_subzone_id` FOREIGN KEY (`subzone_id`) REFERENCES `map_subzone` (`id`),
  CONSTRAINT `map_reseller_zone_id_e05e0709_fk_map_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `map_zone` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_reseller`
--

LOCK TABLES `map_reseller` WRITE;
/*!40000 ALTER TABLE `map_reseller` DISABLE KEYS */;
INSERT INTO `map_reseller` VALUES (1,'DEMO-RESELLER-001','Demo Reseller','01700000010',12,1,1);
/*!40000 ALTER TABLE `map_reseller` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_sitesettings`
--

DROP TABLE IF EXISTS `map_sitesettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_sitesettings` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `site_name` varchar(120) NOT NULL,
  `tagline` varchar(200) NOT NULL,
  `logo` varchar(100) DEFAULT NULL,
  `port` int(10) unsigned NOT NULL CHECK (`port` >= 0),
  `setup_completed` tinyint(1) NOT NULL,
  `default_can_add_data` tinyint(1) NOT NULL,
  `default_can_edit_data` tinyint(1) NOT NULL,
  `default_can_delete_data` tinyint(1) NOT NULL,
  `default_can_manage_users` tinyint(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `gps_max_distance_km` int(10) unsigned NOT NULL CHECK (`gps_max_distance_km` >= 0),
  `map_center_lat` double NOT NULL,
  `map_center_lng` double NOT NULL,
  `map_zoom` smallint(5) unsigned NOT NULL CHECK (`map_zoom` >= 0),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_sitesettings`
--

LOCK TABLES `map_sitesettings` WRITE;
/*!40000 ALTER TABLE `map_sitesettings` DISABLE KEYS */;
INSERT INTO `map_sitesettings` VALUES (1,'fiber-map','Fiber network management map','',5003,1,1,1,0,0,'2026-10-27 03:54:28.163618',500,23.8103,90.4125,13);
/*!40000 ALTER TABLE `map_sitesettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_subzone`
--

DROP TABLE IF EXISTS `map_subzone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_subzone` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` longtext DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `zone_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `map_subzone_zone_id_74097196_fk_map_zone_id` (`zone_id`),
  CONSTRAINT `map_subzone_zone_id_74097196_fk_map_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `map_zone` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_subzone`
--

LOCK TABLES `map_subzone` WRITE;
/*!40000 ALTER TABLE `map_subzone` DISABLE KEYS */;
INSERT INTO `map_subzone` VALUES (1,'DEMO-ZN-GUL','Gulshan',NULL,NULL,23.7925,90.4078,1),(2,'DEMO-ZN-MIR','Mirpur',NULL,NULL,23.8069,90.3687,1),(3,'DEMO-ZN-AGR','Agrabad',NULL,NULL,22.3269,91.8317,2),(4,'DEMO-ZN-PAH','Pahartali',NULL,NULL,22.3676,91.7978,2);
/*!40000 ALTER TABLE `map_subzone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_tjbox`
--

DROP TABLE IF EXISTS `map_tjbox`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_tjbox` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `marker_id` bigint(20) NOT NULL,
  `subzone_id` bigint(20) DEFAULT NULL,
  `zone_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `marker_id` (`marker_id`),
  KEY `map_tjbox_subzone_id_7fd726dc_fk_map_subzone_id` (`subzone_id`),
  KEY `map_tjbox_zone_id_539149f1_fk_map_zone_id` (`zone_id`),
  CONSTRAINT `map_tjbox_marker_id_6c7454ae_fk_map_marker_id` FOREIGN KEY (`marker_id`) REFERENCES `map_marker` (`id`),
  CONSTRAINT `map_tjbox_subzone_id_7fd726dc_fk_map_subzone_id` FOREIGN KEY (`subzone_id`) REFERENCES `map_subzone` (`id`),
  CONSTRAINT `map_tjbox_zone_id_539149f1_fk_map_zone_id` FOREIGN KEY (`zone_id`) REFERENCES `map_zone` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_tjbox`
--

LOCK TABLES `map_tjbox` WRITE;
/*!40000 ALTER TABLE `map_tjbox` DISABLE KEYS */;
INSERT INTO `map_tjbox` VALUES (1,'DEMO-TJ-001','Demo TJ Box 1',4,1,1),(2,'DEMO-TJ-002','Demo TJ Box 2',5,2,1),(3,'DEMO-TJ-003','Demo TJ Box 3',6,4,2);
/*!40000 ALTER TABLE `map_tjbox` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_userprofile`
--

DROP TABLE IF EXISTS `map_userprofile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_userprofile` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `biography` longtext DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `is_manager` tinyint(1) NOT NULL,
  `role` varchar(20) NOT NULL,
  `user_type` varchar(20) NOT NULL,
  `can_add_data` tinyint(1) NOT NULL,
  `can_delete_data` tinyint(1) NOT NULL,
  `can_edit_data` tinyint(1) NOT NULL,
  `can_manage_users` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_userprofile`
--

LOCK TABLES `map_userprofile` WRITE;
/*!40000 ALTER TABLE `map_userprofile` DISABLE KEYS */;
INSERT INTO `map_userprofile` VALUES (1,'pbkdf2_sha256$20000$Ckuzg0D2rxCDXqJaWxrQgR$5U/en4gPhNij3qpN0Vo1/zmNLEcD2qiFjd128wlzxEc=',NULL,1,'admin','Demo','Administrator','admin@example.com',1,1,'2026-10-27 03:54:28.170702',NULL,NULL,NULL,NULL,0,'admin','admin',1,1,1,1);
/*!40000 ALTER TABLE `map_userprofile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_userprofile_groups`
--

DROP TABLE IF EXISTS `map_userprofile_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_userprofile_groups` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userprofile_id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `map_userprofile_groups_userprofile_id_group_id_876fb059_uniq` (`userprofile_id`,`group_id`),
  KEY `map_userprofile_groups_group_id_7ffca625_fk_auth_group_id` (`group_id`),
  CONSTRAINT `map_userprofile_grou_userprofile_id_f1731c64_fk_map_userp` FOREIGN KEY (`userprofile_id`) REFERENCES `map_userprofile` (`id`),
  CONSTRAINT `map_userprofile_groups_group_id_7ffca625_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_userprofile_groups`
--

LOCK TABLES `map_userprofile_groups` WRITE;
/*!40000 ALTER TABLE `map_userprofile_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `map_userprofile_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_userprofile_user_permissions`
--

DROP TABLE IF EXISTS `map_userprofile_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_userprofile_user_permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userprofile_id` bigint(20) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `map_userprofile_user_per_userprofile_id_permissio_8ebc5d7f_uniq` (`userprofile_id`,`permission_id`),
  KEY `map_userprofile_user_permission_id_4a85c20b_fk_auth_perm` (`permission_id`),
  CONSTRAINT `map_userprofile_user_permission_id_4a85c20b_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `map_userprofile_user_userprofile_id_1763bc82_fk_map_userp` FOREIGN KEY (`userprofile_id`) REFERENCES `map_userprofile` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_userprofile_user_permissions`
--

LOCK TABLES `map_userprofile_user_permissions` WRITE;
/*!40000 ALTER TABLE `map_userprofile_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `map_userprofile_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_zone`
--

DROP TABLE IF EXISTS `map_zone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_zone` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` longtext DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_zone`
--

LOCK TABLES `map_zone` WRITE;
/*!40000 ALTER TABLE `map_zone` DISABLE KEYS */;
INSERT INTO `map_zone` VALUES (1,'DEMO-BR-DHK','Dhaka','Fictional demo branch.',NULL,23.8103,90.4125),(2,'DEMO-BR-CTG','Chattogram','Fictional demo branch.',NULL,22.3569,91.7832);
/*!40000 ALTER TABLE `map_zone` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-27  9:54:34
