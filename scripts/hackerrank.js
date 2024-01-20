require("dotenv").config();

const hackerRank = (hackerRankIDs) => {
   return hackerRankIDs.map((username) => {
      let fetchUserDataFromHackerRank = new Promise((resolve, reject) => {
         fetch(`${process.env.HACKERRANK_API}/${username}/badges/`)
            .then((res) => {
               if(res.status === 404) {
                  return resolve("Incorrect HackerRank Username")
               }
               return res.json();
            })
            .then((data) => {
               if (data?.error) {
                  return resolve("Incorrect HackerRank Username");
               }
               const { models } = data;
               const [badge] = models.filter(
                  (el) => el.badge_name === "Problem Solving"
               );
               return resolve(
                  badge?.stars
                     ? badge.stars
                     : "User does not have a Problem Solving badge"
               );
            })
            .catch((error) => reject(error));
      });
      return fetchUserDataFromHackerRank;
   });
};

module.exports = hackerRank;
