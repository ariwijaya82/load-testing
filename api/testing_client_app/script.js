"use strict";

const WebSocket = require("ws");
const axios = require("axios");

const handleCATTest = () => {};

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

    intervalId = setInterval(() => {
      axios
        .get(`${context.vars.target}/test_list`, {
          headers: { Authorization: `Bearer ${context.vars.token}` },
        })
        .then((res) => {
          const res_data = res.data.data;
          if (res_data.bw_check) {
            clearInterval(intervalId);
            context.vars.test_list = res_data.test_list.map(
              (item) => item.data_index
            );
            console.log("succes get test list:", context.vars.test_list);
            done();
          }
        })
        .catch((err) => {
          console.log("failed get test list");
          done(err);
        });
    }, 3000);

    setTimeout(() => {
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

    context.vars.test_list.forEach((item) => {
      // get question list
      axios
        .post(
          `${context.vars.target}/question_list`,
          {
            test_index: item,
          },
          {
            headers: { Authorization: `Bearer ${context.vars.token}` },
          }
        )
        .then((res) => {
          const res_data = res.data.data;
          if (res_data.type === "cat") {
            handleCATTest(context, done);
          } else {
            // TODO: handle other test
          }
        })
        .catch((err) => {
          console.log("failed get question list");
          done(err);
        });
    });
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
