const passport = require('./auth'); 

async function test() {
  try {
    const email = 'test@example.com'; 
    const password = 'testpassword'; 

    const authenticate = passport.authenticate('local', function (err, user, info) {
      if (err) {
        console.error(err);
        return;
      }
      if (!user) {
        console.log(info.message);
        return;
      }
      console.log('Authentification réussie:', user);
    });

    authenticate({ body: { email, password } });
  } catch (error) {
    console.error(error);
  }
}

test();
