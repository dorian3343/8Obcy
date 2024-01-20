# 8obcy 

---

## A website inspired by the cult webchat "6obcy" made as a project.

---
## Features
```
-Complete anonynimity between Users.
-E2E Encryption
-Easy Deploy
```
---
## Techstack
```
Frontend:
-React.JS
Backend:
-Golang
```
---
## How to start

```
Initial setup:
- Enter the project directory
- Run the command "cd frontend"
- Run the command "npm install" (this may take a while)
- run the file 'start.bat'

After this you just run the start.bat file to deploy the Application
```

## Services explained:
```
1. Frontend:
- Self-explanatory
- Connects to the other services to provide a ui to the endpoints and chat
- Encrypts the messages using AES with a generated key from the E2E key service.


2.WebSocket service:
- Exposes 2 endpoints, one for getting the user count and one for websockets,
- Websockets also implements a live user count update
- Routes the encrypted messages and connects users
- Generates the access key for E2E Service

3.E2E key service:
-Exposes 1 endpoint, used to assign a key generated from a string, when both user's use the 
same access key they get the same   AES Key  
-Does not hold state inside
```