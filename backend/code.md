https://github.com/mosh-hamedani/spring-api-starter
https://github.com/mosh-hamedani/spring-api-finished 
https://github.com/mosh-hamedani/spring-api-finished/commits/main/?before=9ad5b5e28134a06b1d7488b71397d97fb994bdd8+35
# 0. first add dependency and than build it  
# 1. Build the project (downloads deps, compiles, tests, packages)
mvn clean install 

# 2. (Optional) Build without running tests
mvn clean install -DskipTests

clean	Deletes the target/ folder (removes old builds)
install	Compiles, tests, packages, and installs the JAR into your local Maven repo 
1. clean     → delete target/
2. validate  → sanity-check the project
3. compile   → src/main/java → target/classes/*.class
4. test      → run JUnit tests in src/test/java
5. package   → target/my-app-0.0.1.jar
6. verify    → (optional) integration checks
7. install   → copy JAR to ~/.m2/repository

# 3. run directly via Maven (dev mode)
mvn spring-boot:run

# 4.run xampp database 
sudo /opt/lampp/lampp start
http://localhost:8080/phpmyadmin/

sudo /opt/lampp/bin/mysql -u root -p
SHOW DATABASES;



mvn spring-boot:runhttp://localhost:8080/phpmyadmin/


flay way dependcy 
mvn flyway:migrate
mvn flyway:info
mvn flyway:repair
mvn flyway:clean
add maven 
code --install-extension vscjava.vscode-maven

mvn clean spring-boot:run
mvn clean install && mvn spring-boot:run


one more time 
https://members.codewithmosh.com/courses/spring-boot-mastering-apis/lectures/60593304
https://members.codewithmosh.com/courses/spring-boot-mastering-apis/lectures/60802551
https://members.codewithmosh.com/courses/spring-boot-mastering-apis/lectures/60593304

git checkout -b validating_api_requests   
git push -u origin validating_api_requests



stripe login
keep it open 
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed --forward-to http://localhost:8081/checkout/webhook


stripe trigger payment_intent.succeeded \
  --remove payment_intent:payment_method_types \
  --add 'payment_intent:automatic_payment_methods[enabled]=true' \
  --add 'payment_intent:automatic_payment_methods[allow_redirects]=never' \
  --add 'payment_intent:metadata[order_id]=1'



  python3 run.py
  https://www.testsprite.com/dashboard-v3/o/mohammad-ali-shikhis-workspace-55fc8446/create-test/new-project