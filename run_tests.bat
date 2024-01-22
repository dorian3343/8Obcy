@echo

start cmd.exe /k "cd backend/E2EServer/Handlers && go test && cd ../../WebsocketServer/Utils && go test"
