pipeline {
    agent any

    stages {

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
                bat 'npx prisma generate'
            }
        }

        stage('Build Application') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t ai-campus-platform:latest .'
            }
        }

        stage('Deploy Container') {
            steps {
                bat 'docker rm -f ai-campus-container || exit /b 0'
                bat 'docker run -d --name ai-campus-container --env-file "C:\\Users\\Anmol Srivastava\\ai-campus-platform\\.env" -p 3000:3000 ai-campus-platform:latest'
            }
        }
    }
}