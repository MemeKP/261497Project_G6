# 261497Project_G6

# step 1
cd testing

1. pnpm i
2. pnpm install cypress typescript dotenv @tsconfig/node-lts @tsconfig/node-ts @types/node
3. npx cypress install

# step2
cd backend

docker compose up -d --build

# step 3
cd backend

npm run seed

# step 4
cd testing

npx cypress open