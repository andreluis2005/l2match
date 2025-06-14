const { Server } = require('socket.io');

const io = new Server(3001, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log('Usuário conectado ao WebSocket');
  socket.on('quizResult', (data) => {
    console.log('Resultado recebido:', data);
    io.emit('quizResult', data); // Broadcast para todos os clientes
  });
  socket.on('disconnect', () => {
    console.log('Usuário desconectado');
  });
});

console.log('Servidor WebSocket rodando na porta 3001');