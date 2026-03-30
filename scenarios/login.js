import { login } from '../scripts/login.js';
import { scenario } from 'k6/execution';

const csvData = open('../data/users.csv');
const users = csvData.split('\n')
  .slice(1) 
  .filter(line => line.trim()) 
  .map(line => {
    const [user, passwd] = line.split(',');
    return { user: user.trim(), passwd: passwd.trim() };
  });

export function loginScenario() {
  const user = users[scenario.iterationInTest % users.length];
  login(user.user, user.passwd);
}
