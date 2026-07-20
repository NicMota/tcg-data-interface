# TCG Data Interface

Uma aplicação web para gerenciamento e consulta de cartas de Trading Card Games (TCG), permitindo autenticação de usuários e visualização dos dados através de uma interface moderna.

## ✨ Funcionalidades

- Cadastro de usuários
- Login com JWT
- Autenticação protegida
- Consulta de cartas
- Interface responsiva
- Integração com banco de dados usando Prisma

---

## 🛠 Tecnologias

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt

---

## 📁 Estrutura

```
tcg-data-interface/
├── client/
├── server/
└── README.md
```

---

## 🚀 Como executar

### Clone o projeto

```bash
git clone https://github.com/NicMota/tcg-data-interface.git
cd tcg-data-interface
```

### Backend

```bash
cd server
npm install
```

Configure o arquivo `.env`

```env
DATABASE_URL=
JWT_SECRET=
```

Execute as migrations

```bash
npx prisma migrate dev
```

Inicie o servidor

```bash
npm run dev
```

---

### Frontend

```bash
cd client
npm install
npm run dev
```

---

## 🔐 Autenticação

A autenticação utiliza JSON Web Token (JWT).

Após realizar login, o backend retorna um token que deve ser enviado no header:

```
Authorization: Bearer <token>
```

---

## 📦 Banco de Dados

O projeto utiliza Prisma como ORM.

Para atualizar o banco:

```bash
npx prisma migrate dev
```

Visualizar os dados:

```bash
npx prisma studio
```

---

## 📸 Screenshots

Adicione aqui imagens da aplicação.

---

## 📌 Melhorias futuras

- [ ] Favoritos
- [ ] Busca avançada
- [ ] Paginação
- [ ] Perfil do usuário
- [ ] Dashboard
- [ ] Dark Mode

---

## 👨‍💻 Autor

**Nicolas José Mota**

GitHub:
https://github.com/NicMota

---

## 📄 Licença

Este projeto está sob a licença MIT.