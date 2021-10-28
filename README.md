# Templating 📖

> Simple CLI to use inside pipelines to replace strings in any type of file

<p>
  <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/jlenon7/templating?style=for-the-badge&logo=appveyor">

  <img alt="Repository size" src="https://img.shields.io/github/repo-size/jlenon7/templating?style=for-the-badge&logo=appveyor">

  <img alt="License" src="https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge&logo=appveyor">
</p>

Templating is a simple alternative for `Helm template`, but can be used for `any type of file`.

<img src=".github/templating.png" width="200px" align="right" hspace="30px" vspace="100px">

## Installation

```bash
npm install -g @jlenon7/templating
```

## Usage

### Commands 

### Help

> See all commands and tips from templating.

```bash
templating --help
```

### Generate

> Templating will always look for environment variables first and then set the local fields, and format 
> any string that matches the regex {{ NAME }} in the templates folder path. **Please create your templates first,
> then run this command**.

```bash
templating generate ./manifest/templates --set IMAGE_TAG=my-dockerhub-image:latest
```

<p align='center'>
  <img alt="Example Input" src="./.github/input-example.png">
</p>

<p align='center'>
  <img alt="Example Output" src="./.github/output-example.png">
</p>

> manifest/templates/config-map.yml
```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api
  namespace: default
data:
  HOST: "{{ HOST }}"
  PORT: "{{ PORT }}"
  NODE_ENV: "{{ NODE_ENV }}"

```

> manifest/templates/deployment.yml
```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  selector:
    matchLabels:
      run: api
  replicas: 1
  template:
    metadata:
      labels:
        run: api
    spec:
      nodeSelector:
        group: apps-public-vpc
      containers:
        - image: {{ IMAGE_TAG }}
          imagePullPolicy: IfNotPresent
          name: api
          envFrom:
            - configMapRef:
                name: api
          ports:
            - containerPort: 80
              protocol: TCP
              name: http
          resources:
            limits:
              memory: 500Mi
            requests:
              memory: 500Mi
```

---

#### Using templating in a Gitlab CI pipeline

```yaml
services:
  - docker:dind

variables:
  IMAGE_LATEST: nickname-organization/your-image-name-here:latest
  IMAGE_TAG: nickname-organization/your-image-name-here:$CI_COMMIT_SHA

stages:
  - test
  - build
  - deploy

Verify lint and run tests:
  image: node:16.13.0
  stage: test
  services:
    - redis:latest
    - postgres:latest
  variables:
    POSTGRES_DB: "postgres"
    POSTGRES_USER: "postgres"
    POSTGRES_PASSWORD: "root"
    DATABASE_URL_TESTING: "postgresql://postgres:root@postgres:5432/postgres?schema=public"
  script:
    - cp ./manifest/.env.ci .env.ci
    - npm install --silent
    - npm run lint:fix
    - npm run test:ci
  only:
    - merge_requests

Build and push image to Dockerhub:
  image: docker:latest
  stage: build
  script:
    - echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    - docker pull $IMAGE_LATEST || true
    - docker build --cache-from $IMAGE_LATEST -t $IMAGE_TAG -t $IMAGE_LATEST .
    - docker push $IMAGE_TAG
    - docker push $IMAGE_LATEST
  only:
    - main

Deploy image to K8S Cluster:
  image: jlenon7/gitlab-deploy:latest
  stage: deploy
  script:
    - aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
    - aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
    - aws configure set region $AWS_DEFAULT_REGION
    - aws eks --region $AWS_DEFAULT_REGION update-kubeconfig --name eks-$AWS_DEFAULT_REGION-production
    - templating generate ./manifest/templates --set IMAGE_TAG=$IMAGE_TAG
    - kubectl apply -f ./manifest/config-map.yml -f ./manifest/deployment.yml
  needs: ["Build and push image to Dockerhub"]
  only:
    - main
```

---

Made with 🖤 by [jlenon7](https://github.com/jlenon7) :wave:
