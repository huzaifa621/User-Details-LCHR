require("dotenv").config();

const leetCode = (leetCodeIDs) => {
   return leetCodeIDs.map((username) => {
      let fetchUserDataFromLeetCode = new Promise((resolve, reject) => {
         const endpoint = process.env.LEETCODE_API;
         const graphqlQuery = `
            query userProblemsSolved($username: String!) {
               allQuestionsCount {
                  difficulty
                  count
               }
               matchedUser(username: $username) {
                  problemsSolvedBeatsStats {
                     difficulty
                     percentage
                  }
                  submitStatsGlobal {
                     acSubmissionNum {
                        difficulty
                        count
                     }
                  }
               }
            }`;

         const variables = {
            username,
         };

         const graphqlOptions = {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: graphqlQuery, variables: variables }),
         };

         fetch(endpoint, graphqlOptions)
            .then((response) => {
               if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
               }
               return response.json();
            })
            .then((data) => {
               if (data?.errors) {
                  return resolve({
                     easy: "Incorrect LeetCode Username",
                     medium: "Incorrect LeetCode Username",
                     hard: "Incorrect LeetCode Username",
                  });
               }
               const { acSubmissionNum } =
                  data.data.matchedUser.submitStatsGlobal;
               const [easy] = acSubmissionNum.filter(
                  (el) => el.difficulty === "Easy"
               );
               const [medium] = acSubmissionNum.filter(
                  (el) => el.difficulty === "Medium"
               );
               const [hard] = acSubmissionNum.filter(
                  (el) => el.difficulty === "Hard"
               );

               resolve({
                  easy: easy.count,
                  medium: medium.count,
                  hard: hard.count,
               });
            })
            .catch((error) => {
               reject("GraphQL Error:", error);
            });
      });
      return fetchUserDataFromLeetCode;
   });
};

module.exports = leetCode;
