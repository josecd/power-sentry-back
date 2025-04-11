export const configurationEnv = () => {
    return {
    PORT_BD: process.env.PORT_BD,
    HOST: process.env.HOST,
    PASSWORD: process.env.PASSWORD,
    USERNAME: process.env.USERNAME,
    DATABASE: process.env.DATABASE,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRATION_TIME: process.env.JWT_EXPIRATION_TIME
}}