pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        FRONTEND_IMAGE = 'resume-ai-frontend'
        BACKEND_IMAGE = 'resume-ai-backend'
        DOCKER_TAG = "${BUILD_NUMBER}"
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
        
        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    bat 'docker-compose down || true'
                    bat 'docker-compose up -d'
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}