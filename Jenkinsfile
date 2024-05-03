def appname = 'asp-feb'
def deploy_group = 'asp-feb-backend'
def s3_bucket = 'capstone-gh-codedeploy'
def s3_filename = 'asp-feb-gh-backend-src'

//Slack Notification Integration
def gitName = env.GIT_BRANCH
def jobName = env.JOB_NAME
def branchName = env.BRANCH_NAME
def main_branch = ['staging', 'develop']

// Environments Declaration
environment {
  jobName = env.JOB_NAME
  branchName = env.BRANCH_NAME
}

// Successful Build
def buildSuccess = [
  [text: "asp-feb-gh-Backend Build Successful on ${branchName} :white_check_mark:",
  fallback: "asp-feb-gh-Backend Build Successful on ${branchName} :white_check_mark:",
  color: "#00FF00"
  ]
]

// Failed Build
def buildError = [
  [text: "asp-feb-gh-Backend Build Failed on ${branchName} :x:",
  fallback: "asp-feb-gh-Backend Build Failed on ${branchName} :x:",
  color: "#FF0000",
  ]
]

pipeline {
  agent any
  tools {nodejs "nodejs"}

  stages {
    stage('Install Dependencies') {
        steps {
            sh 'yarn install'
        }
    }

    stage('Linting') {
        steps {
            sh 'yarn lint'
        }
    }
    stage('Build') {
     
      steps {

          sh 'yarn build'

      }
    }
    // stage('Unit Testing') {
    //     steps {
    //         sh 'npm run test'
    //     }
    // }

    // stage('SonarQube Analysis') {
    //   when {
    //     anyOf {
    //       branch 'develop';
    //     }
    //   }
    //   steps {
    //     withSonarQubeEnv(credentialsId: 'SonarQubeRw', installationName: 'training-sonar-rw') {
    //       script {
    //         def scannerHome = tool 'SonarScanner';
    //         sh "${scannerHome}/bin/sonar-scanner"
    //       }
    //     }
    //   }
    // }

    stage('Prepare to Deploy') {
      when {
        anyOf {
          branch 'develop';
        }
      }
       steps {
         withAWS(region:'eu-west-1',credentials:'aws-cred-training-center') {
           script {
             def gitsha = sh(script: 'git log -n1 --format=format:"%H"', returnStdout: true)
             s3_filename = "${s3_filename}-${gitsha}"
             sh """
                 aws deploy push \
                 --application-name ${appname} \
                 --description "This is a revision for the ${appname}-${gitsha}" \
                 --s3-location s3://${s3_bucket}/${s3_filename}.zip \
                 --source .
               """
           }
         }
       }
     }

    stage('Deploy to Development') {
      when {
        anyOf {
          branch 'develop';
        }
      }
       steps {
         withAWS(region:'eu-west-1',credentials:'aws-cred-training-center') {
           script {
             sh """
                 aws deploy create-deployment \
                 --application-name ${appname} \
                 --deployment-config-name CodeDeployDefault.OneAtATime \
                 --deployment-group-name ${deploy_group} \
                 --file-exists-behavior OVERWRITE \
                 --s3-location bucket=${s3_bucket},key=${s3_filename}.zip,bundleType=zip
               """
           }
         }
	   }
	 }

    stage('Clean WS') {
      steps {
        cleanWs()
      	}
   	}
 }
 post {
    always {
      echo 'One way or another, I have finished'
      cleanWs()
    }
    success {
      script {
        //  slackSend(channel:"jenkins-test", attachments: buildSuccess, notifyCommitters: true)
         echo "I am successful"
      }

    }
    unstable {
      echo 'I am unstable :/'
    }
    failure {
    script {
          // slackSend(channel:"jenkins-test", attachments: buildError)
        echo "I am a failure"
    }
    }
    changed {
      echo 'Things were different before...'
    	}
  }
}
