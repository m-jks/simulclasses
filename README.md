# Guide de Déploiement - SimulClasses 🏫

Ce référentiel contient l'application web **SimulClasses**, un outil interactif d'aide à la répartition d'élèves et de création de classes scolaires optimales pour les directeurs et enseignants d'écoles primaires.

Cette application est packagée pour être exécutée localement ou déployée rapidement sur n'importe quel hébergeur statique ou conteneurisé.

---

## 🔒 Confidentialité & RGPD par construction (sessionStorage)

Pour se conformer pleinement aux exigences académiques de protection des données, **l'application ne stocke aucune donnée sur les serveurs distants** et n'utilise pas de base de données persistante de navigateur (pas de `localStorage`).
* Toutes les données saisies (effectifs, seuils) et les scénarios sauvegardés sont conservés uniquement dans l'espace mémoire temporaire de l'onglet du navigateur (`sessionStorage`).
* **Fermer l'onglet ou le navigateur supprime immédiatement et définitivement toutes les données utilisateur.**

---

## 🛠️ Exécution Locale

### 1. Prérequis
Assurez-vous d'avoir [Node.js](https://nodejs.org/) (version 18 ou supérieure) installé.

### 2. Installation des dépendances
```bash
npm install
```

### 3. Lancement en mode Développement (avec rechargement à chaud)
```bash
npm run dev
```
L'application est alors accessible sur : `http://localhost:3000`

### 4. Build de Production
Pour compiler l'application en fichiers statiques optimisés (générés dans le dossier `/dist`) :
```bash
npm run build
```

---

## 🚀 Options de Déploiement

SimulClasses étant une application 100% côté client (SPA), elle est extrêmement simple, économique et sécurisée à héberger :

### Option 1 : Déploiement unifié via Google AI Studio Build
1. Dans l'interface **Google AI Studio**, cliquez simplement sur le bouton **Share** ou **Deploy**.
2. La plateforme compile automatiquement le projet et l'héberge de manière optimale et sécurisée sur Cloud Run sans aucune configuration additionnelle.

### Option 2 : Hébergement sur GitHub Pages 🚀 (Recommandé - Automatisé)

L'application a été entièrement optimisée pour **GitHub Pages** (utilisation de chemins relatifs `./` pour le chargement sans faille des scripts et images, quel que soit le nom du dépôt). Un workflow d'intégration continue GitHub Actions a été ajouté pour automatiser le déploiement.

**Comment l'activer en 3 étapes :**
1. **Poussez votre dépôt sur GitHub** : Créez un dépôt sur GitHub et poussez votre code (`git push origin main`).
2. **Autorisez GitHub Actions à publier** : En raison des paramètres de sécurité par défaut de GitHub, allez dans les paramètres de votre dépôt GitHub :
   * Renseignez `Settings` ➡️ `Actions` ➡️ `General`.
   * Faites défiler jusqu'à **Workflow permissions** et sélectionnez **Read and write permissions**. Cliquez sur **Save**.
3. **Configurez Github Pages** :
   * Allez dans `Settings` ➡️ `Pages`.
   * Sous **Build and deployment**, option **Source**, choisissez **Deploy from a branch**.
   * Choisissez la branche **`gh-pages`** et le dossier **`/ (root)`**, puis cliquez sur **Save**.
   
Chaque modification poussée sur la branche principale (`main` ou `master`) va désormais compiler et mettre à jour votre site instantanément de manière transparente !

### Option 3 : Autres Hébergements Statiques Ultra-Légers
Puisque le build génère un simple dossier `dist/` contenant du HTML, du JS et du CSS, vous pouvez l'héberger gratuitement ou pour quelques centimes par mois sur :
* **Firebase Hosting** (Recommandé dans l'écosystème Google Cloud)
* **Google Cloud Storage** (configuré en site statique public)
* **Vercel**, **Netlify**, ou tout serveur web standard (Apache, Nginx).

### Option 4 : Servir avec un serveur de fichiers statiques léger dans Docker
Si vous devez absolument déployer via Cloud Run manuellement en mode conteneurisé, vous pouvez utiliser un conteneur Nginx minimaliste.
Exemple de `Dockerfile` pour site statique :
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
Puis déployez sur Cloud Run :
```bash
gcloud run deploy simulclasses --source . --platform managed --allow-unauthenticated
```

---

## 📐 Personnalisations Faciles

* **CSS & Design :** L'application est élégamment stylisée à l'aide de **Tailwind CSS**. Pour modifier la palette de couleurs, éditez simplement le fichier `src/index.css` ou les classes Tailwind dans `src/App.tsx`.
