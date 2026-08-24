import mysql from "mysql2/promise";
import env from "../config/env.js";

const conection = mysql.createPool(env.db);

console.log("CONECTADO AO BANCO DE DADOS");

export default conection;
