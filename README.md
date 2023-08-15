# LINFO1212-2023-8
Lancer le serveur :
1. aller dans le repertoire ou se trouve app.js
2. Écrire dans le terminal node app.js
3. se rendre sur http://localhost:8080

**Problèmes potentiels :**
 - bcrypt doit être installé manuellement

 - sqlite3 doit être installé manuellement

 - sequelize doit être installé manuellement

**Solutions :**
*désinstaller le fichier existant pour chaque cas avant de le réinstaller
 - rm ./node_modules/bcrypt
 - rm ./node_modules/sqlite3
 - rm ./node_modules/sequelize*

 - npm install bcrypt

 - npm install sqlite3 --save

 - npm install sequelize --save
