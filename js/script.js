// We are using jQuery - References used in the creation of this script are at the top of index.html


// This loads our menu and footer templates into the main pages to avoid duplication
// Added menu highlight for the current page, but had to nest the load delay function for .nav-link
// Added aria-current attribute to the menu for the current page for accessibility
// Added functionality to clear the <div> containing the map when reset button clicked


$(document).ready(function () {
    $('header').load('components/header.html');
    $('footer').load('components/footer.html');
    $('#menu').load('components/menu.html', function () {
        $('.nav-link').each(function () {
            if (this.href === window.location.href) {
                $(this).addClass('active');
                $(this).attr('aria-current', 'page');
            }
        });
    });

    // Clear map when reset button clicked
    $('form[name=\"contact\"]').on('reset', function () {
        if (leafletMap) {
            leafletMap.remove();
            leafletMap = null;
            leafletMarker = null;
        }
        const mapDiv = $('#map');
        mapDiv.empty();
        mapDiv
            .removeAttr('class style')
            .addClass('rounded border mb-4')
            .css('height', '300px');
    });

    // Load quiz data from JSON and start the quiz
    $.getJSON("data/quizdata.json", function (data) {
        quizData = data;
        remainingQuestions = [...quizData];
        if (remainingQuestions.length > 0) {
            displayRandomQuestion();
        }
    });    
      

    // Show clue in modal when the button for a clue is clicked
    $('#clueBtn').on('click', function () {
        if (currentQuestion && currentQuestion.clue) {
            $('#clueText').text(currentQuestion.clue);
        } else {
            $('#clueText').text("No clue on this one.");
        }
    });

    // Bind the enter key to the submit button for the quiz
    $('#userAnswer').keypress(function (e) {
        if (e.keyCode === 13) {
          e.preventDefault();
          $('#submitBtn').click();
        }
      });

});


// Logic to call api: api.postcodes.io/postcodes/ and lookup a UK postcode input

async function findPostcode() {
    const postcode = $("#postcode").val().trim();
    const url = "https://api.postcodes.io/postcodes/?q=" + postcode;

    const cityElement = $("#city");
    const countryElement = $("#country");

    try {
        const response = await $.getJSON(url);

        if (response.result && response.result.length > 0) {
            const result = response.result[0];
            const city = result.admin_district;
            const country = result.country;
            const lat = result.latitude;
            const lng = result.longitude;

            cityElement.val(city).css({ color: "green" });
            countryElement.val(country).css({ color: "green", fontWeight: "bold" });

            showMap(lat, lng);

        } else {
            cityElement.val("No UK results found for this postcode.")
                .css({ color: "red" });
            countryElement.val("Elsewhere").css({ color: "green", fontWeight: "bold" });
        }
    } catch (error) {
        cityElement.val("Error fetching postcode data.")
            .css({ color: "red", fontWeight: "bold" });
        console.error(error);
    }
}

// Use LeafletMap to display a map for the location entered by the user
let leafletMap;
let leafletMarker;

function showMap(lat, lng) {
    const mapContainer = $("#map");

    if (!leafletMap) {
        leafletMap = L.map(mapContainer[0]).setView([lat, lng], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(leafletMap);
    } else {
        leafletMap.setView([lat, lng], 13);
    }

    if (leafletMarker) {
        leafletMap.removeLayer(leafletMarker);
    }

    leafletMarker = L.marker([lat, lng]).addTo(leafletMap);
}

// Quiz Functionality Section

let quizData = [];
let currentQuestion = {};
let remainingQuestions = [];
let score = 0;
let questionIndex = 0;

// Get and display a random question without repeating, and display the score at the end
function displayRandomQuestion() {
    if (remainingQuestions.length === 0) {
        const totalQuestions = quizData.length;
        $("#questionLabel").text("Quiz complete!");
        $("#answerLabel").text(``);
        $("#finalScore").text(`You got ${score} out of ${totalQuestions} questions correct.`);
        $("#userAnswer").prop("disabled", true);
        $("#submitBtn").prop("disabled", true);
        $("#restartBtn").removeClass("d-none");
        return;
    }

    const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
    currentQuestion = remainingQuestions.splice(randomIndex, 1)[0];
    questionIndex++;

    $("#questionLabel").text(`Question ${questionIndex}: ${currentQuestion.question}`);
    $("#userAnswer").val("").prop("disabled", false);
    $("#submitBtn").prop("disabled", false);
    $("#answerLabel").css({ color: "black", fontWeight: "normal" }).text("To be revealed!");
    $("#finalScore").text("");
    $("#dogFact").text("");
}

// Check the user's answer and show result (all in lowercase)
function checkAnswer() {
    const userAnswer = $("#userAnswer").val().trim().toLowerCase();
    const isCorrect = currentQuestion && userAnswer === currentQuestion.answer.trim().toLowerCase();

    if (isCorrect) {
        score++;
        $("#answerLabel").css({ color: "green", fontWeight: "bold" }).text("Nicely done! You are correct!");
    } else {
        $("#answerLabel").css({ color: "red", fontWeight: "bold" }).text(`You are incorrect. The answer is ${currentQuestion.answer}.`);
    }

    getDogFact(isCorrect);
    setTimeout(displayRandomQuestion, 7000);
}

// Restart the quiz
function resetQuiz() {
    score = 0;
    questionIndex = 0;
    remainingQuestions = [...quizData];
    $("#restartBtn").addClass("d-none");
    $("#userAnswer").prop("disabled", false);
    $("#submitBtn").prop("disabled", false);
    $("#finalScore").text("");
    $("#dogFact").text("");
    displayRandomQuestion();
}


// Logic for an additional API integration to obtain and show a random dog fact after each answer
function getDogFact(isCorrect) {
    fetch("https://dogapi.dog/api/v2/facts")
        .then(response => response.json())
        .then(data => {
            const fact = data.data[0].attributes.body;
            const message = isCorrect
                ? `Ariel is pleased. 🐶 Did you know? ${fact}`
                : `Ariel forgives you. 🐾 Here's a dog fact: ${fact}`;
            $("#dogFact").text(message);
        })
        .catch(() => {
            $("#dogFact").text("Couldn't find a dog fact at the moment 🐾");
        });
}
  