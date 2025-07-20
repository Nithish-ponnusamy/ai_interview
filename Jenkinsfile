pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        FRONTEND_IMAGE = 'resume-ai-frontend'
        BACKEND_IMAGE = 'resume-ai-backend'
        DOCKER_TAG = "${BUILD_NUMBER}"
        REGISTRY_URL = 'your-docker-registry.com'
        STAGING_SERVER = 'staging-server.com'
        PRODUCTION_SERVER = 'production-server.com'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Node.js') {
            steps {
                script {
                    def nodeHome = tool name: 'NodeJS', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
                    env.PATH = "${nodeHome}/bin:${env.PATH}"
                }
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            bat 'npm ci'
                        }
                    }
                }
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            bat 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            bat 'npm run test -- --coverage --watchAll=false'
                        }
                    }
                }
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            bat 'npm test'
                        }
                    }
                }
            }
        }
        
        stage('Build Applications') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            bat 'npm run build'
                        }
                    }
                }
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            echo 'Backend build completed'
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Frontend Image') {
                    steps {
                        dir('frontend') {
                            script {
                                docker.build("${FRONTEND_IMAGE}:${DOCKER_TAG}")
                                docker.build("${FRONTEND_IMAGE}:latest")
                            }
                        }
                    }
                }
                stage('Build Backend Image') {
                    steps {
                        dir('backend') {
                            script {
                                docker.build("${BACKEND_IMAGE}:${DOCKER_TAG}")
                                docker.build("${BACKEND_IMAGE}:latest")
                            }
                        }
                    }
                }
            }
        }
        
        stage('Push Images to Registry') {
            steps {
                script {
                    docker.withRegistry("https://${REGISTRY_URL}", 'docker-registry-credentials') {
                        docker.image("${FRONTEND_IMAGE}:${DOCKER_TAG}").push()
                        docker.image("${FRONTEND_IMAGE}:latest").push()
                        docker.image("${BACKEND_IMAGE}:${DOCKER_TAG}").push()
                        docker.image("${BACKEND_IMAGE}:latest").push()
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    // Generate staging environment file
                    writeFile file: '.env.staging', text: """
DOCKER_TAG=${DOCKER_TAG}
FRONTEND_IMAGE=${REGISTRY_URL}/${FRONTEND_IMAGE}
BACKEND_IMAGE=${REGISTRY_URL}/${BACKEND_IMAGE}
ENVIRONMENT=staging
FRONTEND_PORT=3001
BACKEND_PORT=5001
"""
                    
                    // Deploy using docker-compose
                    bat '''
                        docker-compose -f deployment/docker-compose.staging.yml down || true
                        docker-compose -f deployment/docker-compose.staging.yml --env-file .env.staging pull
                        docker-compose -f deployment/docker-compose.staging.yml --env-file .env.staging up -d
                    '''
                    
                    // Wait for services to be healthy
                    bat 'timeout /t 30'
                    
                    // Health check
                    script {
                        try {
                            bat 'curl -f http://localhost:3001 || exit 1'
                            bat 'curl -f http://localhost:5001/health || exit 1'
                            echo 'Staging deployment successful!'
                        } catch (Exception e) {
                            error 'Staging health check failed!'
                        }
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Generate production environment file
                    writeFile file: '.env.production', text: """
DOCKER_TAG=${DOCKER_TAG}
FRONTEND_IMAGE=${REGISTRY_URL}/${FRONTEND_IMAGE}
BACKEND_IMAGE=${REGISTRY_URL}/${BACKEND_IMAGE}
ENVIRONMENT=production
FRONTEND_PORT=80
BACKEND_PORT=5000
"""
                    
                    // Deploy using docker-compose
                    bat '''
                        docker-compose -f deployment/docker-compose.production.yml down || true
                        docker-compose -f deployment/docker-compose.production.yml --env-file .env.production pull
                        docker-compose -f deployment/docker-compose.production.yml --env-file .env.production up -d
                    '''
                    
                    // Wait for services to be healthy
                    bat 'timeout /t 30'
                    
                    // Health check
                    script {
                        try {
                            bat 'curl -f http://localhost:80 || exit 1'
                            bat 'curl -f http://localhost:5000/health || exit 1'
                            echo 'Production deployment successful!'
                        } catch (Exception e) {
                            error 'Production health check failed!'
                        }
                    }
                }
            }
        }
        
        stage('Cleanup Old Images') {
            steps {
                script {
                    bat '''
                        docker image prune -f
                        docker system prune -f
                    '''
                }
            }
        }
    }
    
    post {
        always {
            // Archive deployment logs
            archiveArtifacts artifacts: 'deployment/*.yml', allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
            // Send success notification
        }
        failure {
            echo 'Pipeline failed!'
            // Rollback on failure
            script {
                if (env.BRANCH_NAME == 'main') {
                    bat 'docker-compose -f deployment/docker-compose.production.yml down || true'
                }
                if (env.BRANCH_NAME == 'develop') {
                    bat 'docker-compose -f deployment/docker-compose.staging.yml down || true'
                }
            }
        }
    }
}