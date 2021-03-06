const express = require("express");
const router = express();

// Utilities
const validUrl = require("valid-url");
const shortid = require("shortid");

// Models
const Url = require("../models/Url");

// Config variables
const BASEURL = "https://linkifly.tk/";

/*                                              ROUTES                                    */

// Home page
router.get("/", async (req, res) => {
  try {
    return res.render("../views/home", {
      baseUrl: BASEURL,
      message: "",
      value: "",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// Get total number of clicks and number of urls shortened
router.get("/sanay/clicks", async (req, res) => {
  try {
    let sum, numberOfUrl;

    const aggregateSum = await Url.aggregate([
      { $group: { _id: null, amount: { $sum: "$clicks" } } },
    ]);

    sum = aggregateSum[0].amount;

    numberOfUrl = await Url.countDocuments({});

    res.send(
      `Total URLs shortened: ${numberOfUrl}  \n Total number of clicks : ${sum}`
    );
  } catch (error) {}
});

// Creating a new short url
router.post("/shorten", async (req, res) => {
  try {
    const { longurl } = req.body;
    const { customcode } = req.body;
    const baseurl = BASEURL;

    // checking validity of base url
    if (!validUrl.isUri(baseurl)) {
      return res.render("../views/errorpage", {
        errormessage: "Invalid base url",
        status: "Oops!",
      });
    }

    // checking validity of long url
    if (!validUrl.isUri(longurl)) {
      return res.render("../views/errorpage", {
        errormessage: "Invalid long url",
        status: "Oops!",
      });
    }

    // Check if the long url already exists in the database
    const oldurl = await Url.findOne({ longurl: longurl });

    if (oldurl) {
      return res.render("../views/url", {
        url: oldurl,
        message: "Oops! This url has already been shortened",
      });
    }
    if (customcode) {
      // Generate unique short id
      const oldcustom = await Url.findOne({ code: customcode });
      if (oldcustom) {
        return res.render("../views/home", {
          value: longurl,
          baseUrl: baseurl,
          message:
            "Sorry, this code is aleready in use, please enter a new one",
        });
      } else {
        const code = customcode;
        // Short URL
        const shorturl = baseurl + code;

        const newUrl = new Url({
          longurl: longurl,
          code: code,
          shorturl: shorturl,
          heading: "Success",
          p: "Your short url is:",
          date: new Date(),
        });

        const newurl2 = await newUrl.save();

        return res.render("../views/url", {
          url: newurl2,
          message: "",
        });
      }
    } else {
      // Generate unique short id
      const code = shortid.generate();

      // Short URL
      const shorturl = baseurl + code;

      const newUrl = new Url({
        longurl: longurl,
        code: code,
        shorturl: shorturl,
        heading: "Success",
        p: "Your short url is:",
        date: new Date(),
      });

      const newurl2 = await newUrl.save();

      return res.render("../views/url", {
        url: newurl2,
        message: "",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// Adding custom code in url
router.post("/custom/:code", async (req, res) => {
  try {
    const { custom } = req.body;

    // check if custom code already exists
    const oldcustom = await Url.findOne({ code: custom });
    if (oldcustom) {
      return res.render("../views/url", {
        url: oldcustom,
        message: "Sorry, this code is aleready in use, please enter a new one",
      });
    } else {
      const url = await Url.findOne({ code: req.params.code });

      const baseurl = BASEURL;
      const urln = baseurl + custom;

      var newvalues = { $set: { code: custom, shorturl: urln } };

      if (url) {
        Url.findOneAndUpdate(
          { code: req.params.code },
          newvalues,
          async (err, data) => {
            if (err) return res.send("Error");
            else {
              const url2 = await Url.findOne({ code: custom });
              return res.render("../views/url", {
                url: url2,
                message: "",
              });
            }
          }
        );
      } else {
        return res.render("../views/errorpage", {
          errormessage: "Invalid url code",
          status: "Oops!",
        });
      }
    }
  } catch (error) {}
});

// Get all the short urls
router.get("/sanay/archive", async (req, res) => {
  try {
    const urls = await Url.find().sort({ date: -1 }).limit(200);

    return res.render("../views/archive", {
      urls: urls,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// List urls for updation
router.get("/sanay/update/url", async (req, res) => {
  try {
    const urls = await Url.find().sort({ date: -1 });

    return res.render("../views/updateUrl", {
      urls: urls,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// Speicfic Url updation form
router.get("/sanay/update/url/:id", async (req, res) => {
  try {
    await Url.findById(req.params.id, (err, url) => {
      if (err) console.log(err);

      return res.render("../views/updateOneUrl", {
        url: url,
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// Update a Url: longUrl and Code
router.post("/sanay/edit/:id", async (req, res) => {
  try {
    // Return is new longurl is not valid
    if (!validUrl.isUri(req.body.longurl)) {
      return res.render("../views/errorpage", {
        errormessage: "Invalid long url",
        status: "Oops!",
      });
    }
    // New values for updation
    const newValues = {
      longurl: req.body.longurl,
      code: req.body.code,
      shorturl: BASEURL + req.body.code,
    };

    // check if custom code already exists
    const oldcustom = await Url.findOne({
      code: req.body.code,
      _id: { $nin: [req.params.id] },
    });
    if (oldcustom) {
      return res.status(400).json({
        message:
          "Sorry, this code is short code is aleready in use, please enter a new one",
      });
    }

    const url = await Url.findByIdAndUpdate(req.params.id, newValues, {
      new: true,
    });

    return res.render("../views/updateOneUrl", {
      url: url,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// List urls for deletion
router.get("/sanay/delete/url", async (req, res) => {
  try {
    const urls = await Url.find().sort({ date: -1 });

    return res.render("../views/deleteUrl", {
      urls: urls,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// Delete a url by id (the method is get to make request from frontend)
router.get("/sanay/delete/url/:id", async (req, res) => {
  try {
    await Url.findByIdAndDelete(req.params.id);

    const urls = await Url.find().sort({ date: -1 });

    return res.render("../views/deleteUrl", {
      urls: urls,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// Redirecting to the original URL
router.get("/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ code: req.params.code });

    if (url) {
      // checking validity of the url
      if (!validUrl.isUri(url.shorturl)) {
        return res.render("../views/errorpage", {
          errormessage: "Invalid short url",
          status: "Oops!",
        });
      }
      var newvalues = { $set: { clicks: url.clicks + 1 } };

      Url.findOneAndUpdate(
        { code: req.params.code },
        newvalues,
        async (err, data) => {
          if (err) return res.send("Error");
        }
      );

      res.redirect(url.longurl);
    } else {
      return res.render("../views/errorpage", {
        errormessage: "Sorry, the page you are looking for does not exist",
        status: "404 :(",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// Creating short url from params
router.get("/api", async (req, res) => {
  try {
    const baseurl = BASEURL;
    const longurl = req.query.longUrl;

    // checking validity of base url
    if (!validUrl.isUri(baseurl)) {
      return res.render("../views/errorpage", {
        errormessage: "Invalid base url",
        status: "Oops!",
      });
    }

    // checking validity of long url
    if (!validUrl.isUri(longurl)) {
      return res.render("../views/errorpage", {
        errormessage: "Invalid long url",
        status: "Oops!",
      });
    }

    // Check if the long url already exists in the database
    const oldurl = await Url.findOne({ longurl: longurl });

    if (oldurl) {
      return res.json({
        success: true,
        url: oldurl,
      });
    } else {
      // Generate unique short id
      const code = shortid.generate();

      // Short URL
      const shorturl = baseurl + code;

      const newUrl = new Url({
        longurl: longurl,
        code: code,
        shorturl: shorturl,
        date: new Date(),
      });

      const newurl2 = await newUrl.save();

      return res.json({
        success: true,
        shorturl: newurl2.shorturl,
      });
    }
  } catch (error) {}
});

module.exports = router;
