import http from 'k6/http';
import { check } from 'k6';

export function login(username, password) {
  const payload = JSON.stringify({
    username: username,
    password: password
  });

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const res = http.post('https://fakestoreapi.com/auth/login', payload, params);

  check(res, {
    'status is 201': (r) => r.status === 201,
    'has token': (r) => r.json('token') !== undefined
  });

  return res;
}
