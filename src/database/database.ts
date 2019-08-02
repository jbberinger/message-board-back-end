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

// creates new user account if email and username are untaken
export const signup = async (email: string, password: string) => {
  let client: PoolClient;
  try {
    client = await pool.connect();
    try {
      const res: QueryResult = await client.query(
        'INSERT INTO user_account (email, password) VALUES($1, $2)',
        [email, password],
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

// Checks if email is in use
export const checkEmailAvailability = async (
  email: string,
): Promise<boolean | undefined> => {
  try {
    const result: QueryResult = await pool.query(
      'SELECT EXISTS(SELECT * FROM user_account WHERE email = $1);',
      [email],
    );
    return !result.rows[0].exists;
  } catch (err) {
    console.error(err);
  }
};

// retreives password hash from email
export const getPasswordHashFromEmail = async (
  email: string,
): Promise<string | undefined> => {
  console.log('db getPasswordHashFromEmail -> email: ', email);
  try {
    const result: QueryResult = await pool.query(
      'SELECT password FROM user_account WHERE email = $1 LIMIT 1',
      [email],
    );
    return result.rows[0].password;
  } catch (err) {
    console.error(err);
  }
};

// retrieves user id from email
export const getIdFromEmail = async (
  email: string,
): Promise<string | undefined> => {
  console.log('db getIdFromEmail -> email: ', email);
  try {
    const result: QueryResult = await pool.query(
      'SELECT user_id FROM user_account WHERE email = $1 LIMIT 1',
      [email],
    );
    return result.rows[0].user_id;
  } catch (err) {
    console.error(err);
  }
};

// verfies email and password for user login and updates
// login log if successful
export const login = async (email: string, password: string) => {
  let client: PoolClient;
  console.log('db login -> email and pass', email, password);

  client = await pool.connect();
  try {
    await client.query('BEGIN');
    const loginRes: QueryResult = await client.query(
      'SELECT * FROM user_account WHERE (email = $1 AND password = $2) LIMIT 1',
      [email, password],
    );
    const loginLogRes: QueryResult = await client.query(
      'INSERT INTO login_log (user_id) VALUES ($1)',
      [loginRes.rows[0].user_id],
    );
    await client.query('COMMIT');
    console.log(loginLogRes.rows[0]);
  } catch (err) {
    client.query('ROLLBACK');
    console.error(err);
  } finally {
    client.release();
  }
};

export const userLoginCount = async (email: string) => {
  let client: PoolClient;
  try {
    client = await pool.connect();
    try {
      const loginCount: QueryResult = await client.query(
        `SELECT user_account.user_id, COUNT(*) 
          FROM user_account JOIN login_log 
          ON (user_account.email = $1 AND user_account.user_id = login_log.user_id)
          GROUP BY user_account.user_id;`,
        [email],
      );
      console.log(loginCount.rows[0]);
    } catch (err) {
      console.error(err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
  }
};
