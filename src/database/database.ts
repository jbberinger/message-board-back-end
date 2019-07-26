import { QueryResult, Pool, PoolClient } from 'pg';
require('dotenv').config();

const config = {
  // URI containing db connection information
  connectionString: process.env.DB_CONNECTION_STRING,
  // max number of clients the pool should contain
  max: 10,
  // max number of milliseconds a client can remain idle and not
  // checked out before being removed from back end and discarded
  idleTimeoutMillis: 3000,
};

const pool = new Pool(config);

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', err => {
  console.error('Unexpected error on idle client', err);
  // shuts down database
  process.exit(-1);
});

// the pool will emit a connection event when a new client
// connects to PostgreSQL back end
pool.on('connect', client => {
  console.log(
    `pool connected new client to db -> ${pool.totalCount} clients in pool`,
  );
});

// the pool will emit an acquire event when a client is
// checked out and added back to the pool
pool.on('acquire', client => {
  console.log(
    `client checked out and added back to pool -> ${
      pool.totalCount
    } clients in pool`,
  );
});

// the pool will emit a remove event when a client is
// closed and removed from the pool
pool.on('remove', client => {
  console.log(
    `client closed and removed from pool -> ${pool.totalCount} clients in pool`,
  );
});

// tests db connection with single query
export const testDBConnection = async () => {
  try {
    // convenience method for single queries
    // acquires and releases client implicitly
    const { rows } = await pool.query('SELECT NOW()');
    console.log(rows[0].now);
  } catch (err) {
    console.error('initial connection failed', err);
  } finally {
    console.log('db test successful');
  }
};

export const newUser = async (
  email: string,
  password: string,
  username: string,
) => {
  let client: PoolClient;
  try {
    client = await pool.connect();
    try {
      const res: QueryResult = await client.query(
        'INSERT INTO user_account (email, password, username) VALUES($1, $2, $3)',
        [email, password, username],
      );
    } catch (err) {
      console.error(err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
  }
};

// export const connectToDatabase = async () => {
//   try {
//     await client.connect();
//     const dateRes: QueryResult = await client.query('SELECT NOW()');
//     console.log('connected to database successfully at ' + dateRes.rows[0].now);
//     await newUser('jbberinger@gmail.com', '123456789', 'jbberinger');
//     const userAccounts: QueryResult = await client.query(
//       'SELECT * FROM user_account',
//     );
//     console.table(userAccounts.rows[0]);
//     client.end();
//   } catch (err) {
//     console.log(err);
//   }
// };
