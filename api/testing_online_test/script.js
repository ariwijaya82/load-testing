"use strict";

const WebSocket = require("ws");
const axios = require("axios");

const handleCATTest = (test_index, context, done) => {
  return new Promise((resolve, reject) => {
    axios
      .get(`${context.vars.target}/ws_host`, {
        headers: { Authorization: `Bearer ${context.vars.token}` },
      })
      .then((res) => {
        const res_data = res.data.data;
        const host = res_data.selected_host;
        const full_host = res_data.full_url;

        let socket;
        if (context.vars.$environment === "prod") {
          socket = new WebSocket(`wss://${host}/ws`);
        } else {
          socket = new WebSocket(`ws://${host}/ws`);
        }

        let question_index = 0;
        let connection_id;
        socket.onmessage = (event) => {
          const ws_data = JSON.parse(event.data);
          if (ws_data.message_type === "init") {
            connection_id = ws_data.data;
            console.log(`${context.vars.target}/question_list/cat`);
            axios
              .post(
                `${context.vars.target}/question_list/cat`,
                {
                  ws_host: full_host,
                  connection_id: connection_id,
                  test_index: test_index,
                },
                {
                  headers: {
                    Authorization: `Bearer ${context.vars.token}`,
                  },
                }
              )
              .then((res) => {
                console.log("response init cat: ", res.data);
              });
          } else if (ws_data.message_type === "test") {
            // console.log("message test", ws_data.data);
            const cat_status = ws_data.data.cat_status;
            const option = ws_data.data.choice.split("|||");

            if (cat_status === 1) {
              axios
                .post(
                  `${context.vars.target}/all_answers/cat`,
                  {
                    test_index: test_index,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${context.vars.token}`,
                    },
                  }
                )
                .then(() => {
                  if (
                    test_index ===
                    context.vars.test_list[context.vars.test_list.length - 1]
                  ) {
                    console.log("done all test");
                    done();
                  } else {
                    console.log("finish test", test_index);
                    resolve();
                  }
                })
                .catch((err) => {
                  console.log("failed to finish test");
                  done(err);
                });
            } else {
              const submit_data = {
                ws_host: full_host,
                connection_id: connection_id,
                test_index: test_index,
                no_test: question_index + 1,
                answer: (question_index % option.length) + 1,
              };

              // console.log("submit answer", submit_data);
              axios
                .post(`${context.vars.target}/answer/cat`, submit_data, {
                  headers: {
                    Authorization: `Bearer ${context.vars.token}`,
                  },
                })
                .catch((err) => {
                  console.log("failed to submit answer test");
                  done(err);
                });
            }
          }
        };

        socket.onerror = () => {
          console.log("websocket connection error");
          done(new Error("websocket connection error"));
        };
      })
      .catch((err) => {
        console.log("failed get ws host");
        done(err);
      });
  });
};

module.exports = {
  logEnv: function (context, event, done) {
    console.log(
      "Current environment is set to: ",
      context.vars.$environment || "dev"
    );
    done();
  },

  submitBiodata: function (context, event, done) {
    const data = {
      biodata_template_id: 0,
      biodata_form: [
        {
          label: "Nama Depan",
          field_name: "cnd_name",
          value: context.vars.first_name,
        },
        {
          label: "Nama Belakang",
          field_name: "last_name",
          value: context.vars.last_name,
        },
        { label: "Email", field_name: "email", value: context.vars.email },
        {
          label: "Jenis Kelamin",
          field_name: "gender",
          value: context.vars.gender,
        },
        { label: "Tanggal Lahir", field_name: "dob", value: "2000-01-01" },
        {
          label: "Negara (tempat tinggal)",
          field_name: "country",
          value: "Indonesia",
        },
        { label: "Provinsi", field_name: "province_id", value: "Bali" },
        {
          label: "Nomor Handphone",
          field_name: "mobile_phone1",
          value: "111",
        },
        {
          label: "Pendidikan Terakhir",
          field_name: "education_level",
          value: "S1",
        },
        {
          label: "Nama Universitas / Sekolah",
          field_name: "university_name",
          value: "ITS",
        },
        {
          label: "University Status",
          field_name: "university_status",
          value: "Negeri",
        },
      ],
    };

    axios
      .post(`${context.vars.target}/biodata_form`, data, {
        headers: { Authorization: `Bearer ${context.vars.token}` },
      })
      .then((res) => {
        console.log("success submit biodata", res.data);
        done();
      })
      .catch((err) => {
        console.log("failed submit biodata");
        done(err);
      });
  },

  getTestList: function (context, event, done) {
    let intervalId;
    let timeoutId;

    intervalId = setInterval(() => {
      axios
        .get(`${context.vars.target}/test_list`, {
          headers: { Authorization: `Bearer ${context.vars.token}` },
        })
        .then((res) => {
          const res_data = res.data.data;
          if (res_data.bw_check) {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            context.vars.test_list = res_data.test_list.map(
              (item) => item.data_index
            );
            context.vars.test_done = 0;
            console.log("succes get test list:", context.vars.test_list);
            done();
          }
        })
        .catch((err) => {
          console.log("failed get test list");
          done(err);
        });
    }, 3000);

    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      done(new Error("timeout get test list"));
    }, 5000);
  },

  doAllTest: function (context, event, done) {
    if (
      !Array.isArray(context.vars.test_list) ||
      context.vars.test_list.length === 0
    ) {
      console.log("test list is empty");
      done(new Error("test list is empty"));
    }

    const solveTest = (test_index) =>
      axios
        .post(
          `${context.vars.target}/question_list`,
          {
            test_index: test_index,
          },
          {
            headers: { Authorization: `Bearer ${context.vars.token}` },
          }
        )
        .then((res) => {
          const res_data = res.data.data;
          if (res_data.type === "cat") {
            return handleCATTest(test_index, context, done);
          } else {
            // TODO: handle other test
          }
        })
        .catch((err) => {
          console.log("failed get question list");
          done(err);
        });

    let chain = solveTest(context.vars.test_list[0]);
    let index = 1;
    while (index < context.vars.test_list.length) {
      chain = chain.then(solveTest(context.vars.test_list[index]));
      index += 1;
    }
  },

  //   connectToWebSocket: function (context, events, done) {
  //     const WebSocket = require("ws"); // Import WebSocket library

  //     // Define WebSocket URL
  //     const wsUrl = `ws://${context.vars.wsUrl}/ws`;

  //     // Connect to the WebSocket server
  //     const wsClient = new WebSocket(wsUrl);

  //     // Handle WebSocket connection opened
  //     wsClient.on("open", function open() {
  //       console.log("WebSocket connection established ", context.vars.userId);
  //     });

  //     // Handle incoming WebSocket messages
  //     wsClient.on("message", function incoming(data) {
  //       const ws_data = JSON.parse(data);

  //       if (ws_data.message_type === "init") {
  //         console.log(`${context.vars.userId} init`);
  //         context.vars.connId = ws_data.data;
  //         done();
  //       } else {
  //         // console.log(`${context.vars.userId} data: ${JSON.stringify(ws_data.data)}`)
  //       }
  //     });

  //     // Handle WebSocket errors
  //     wsClient.on("error", function error(err) {
  //       console.error("WebSocket error:", err);
  //       done(err); // Fail the test if there is an error
  //     });

  //     // Handle WebSocket connection close
  //     wsClient.on("close", function close() {
  //       console.log("WebSocket connection closed", context.vars.userId);
  //     });
  //   },
};
