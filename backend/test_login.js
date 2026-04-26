async function testLogin() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'cris@ccmergulho.com',
        password: 'wrong-password'
      })
    });
    const data = await response.json();
    console.log('Login Response Status:', response.status);
    console.log('Login Response Data:', data);
  } catch (error) {
    console.log('Login Error:', error.message);
  }
}

testLogin();
