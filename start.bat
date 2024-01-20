@echo

start cmd.exe /k "cd frontend && npm start"
start cmd.exe /k "cd backend/WebSocketServer && go run main.go"
start cmd.exe /k "cd backend/E2EServer && go run main.go"
