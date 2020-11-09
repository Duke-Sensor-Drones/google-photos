function displayAlbumList() {
  // Define view that has list of albums on left, then a pane of images on right that can be selected
  hideError();
  showLoadingDialog();
  $('#identification-albums').empty();

  $.ajax({
    type: 'GET',
    url: '/getAlbums',
    dataType: 'json',
    success: (data) => {
      console.log('Loaded albums: ' + data.albums);
      // Render each album from the backend in its own row, consisting of
      // title, cover image, number of items, link to Google Photos and a
      // button to add it to the photo frame.
      // The items rendered here are albums that are returned from the
      // Library API.
      $.each(data.albums, (i, item) => {
      // Set up a Material Design Lite list.
      const materialDesignLiteList =
          $('<li />').addClass('mdl-list__item mdl-list__item--two-line')
              .addClass('id-album-item')
              .attr('data-id', item.id)
              .attr('data-title', item.title);

      // Create the primary content for this list item.
      const primaryContentRoot =
          $('<div />').addClass('mdl-list__item-primary-content');
      materialDesignLiteList.append(primaryContentRoot);

      // The title of the album as the primary title of this item.
      const primaryContentTitle = $('<div />').text(item.title);
      primaryContentRoot.append(primaryContentTitle);

      // The number of items in this album as the sub title.
      const primaryContentSubTitle =
          $('<div />')
              .text(`(${item.mediaItemsCount} items)`)
              .addClass('mdl-list__item-sub-title');
      primaryContentRoot.append(primaryContentSubTitle);

      // Add the list item to the list of albums.
      $('#identification-albums').append(materialDesignLiteList);
      });

      hideLoadingDialog();
      console.log('Albums loaded.');
    },
      error: (data) => {
          hideLoadingDialog();
          handleError('Couldn\'t load albums', data);
      }
  });
}

function showPreview(source, mediaItems) {
  $('#images-container').empty();
  // Loop over each media item and render it.
  $.each(mediaItems, (i, item) => {
    // Construct a thumbnail URL from the item's base URL at a small pixel size.
    const thumbnailUrl = `${item.baseUrl}=w256-h256`;

    // Compile the caption, conisting of the description, model and time.
    const description = item.description ? item.description : '';
    const model = item.mediaMetadata.photo.cameraModel ?
        `#Shot on ${item.mediaMetadata.photo.cameraModel}` :
        '';
    const time = item.mediaMetadata.creationTime;
    const captionText = `${description} ${model} (${time})`

    const thumbnailDiv = $('<a />')
        .addClass('id-media-item')
        .attr('data-base-url', item.baseUrl)
        .attr('data-media-id', item.id)
        .attr('style', "position: relative; width: max-content;");

    const thumbnailImage = $('<img />')
                               .attr('src', thumbnailUrl)
                               .attr('alt', captionText)
                               .addClass('img-fluid rounded thumbnail');
    thumbnailDiv.append(thumbnailImage);

    const checkmark = $('<i />')
                                .addClass('material-icons')
                                .addClass('image-check-unchecked')
                                .attr('id', "check_" + item.id)
                                .text("check_circle");
    thumbnailDiv.append(checkmark);

    $('#images-container').append(thumbnailDiv);
  });
};

function loadFromAlbum(name, id) {
  console.log("ALBUM:"+id);
  showLoadingDialog();
  // Make an ajax request to the backend to load from an album.
  $.ajax({
    type: 'POST',
    url: '/loadFromAlbum',
    dataType: 'json',
    data: {albumId: id},
    success: (data) => {
      console.log('Albums imported:' + JSON.stringify(data.parameters));
      if (data.photos && data.photos.length) {
        // Photos were loaded from the album, open the photo frame preview
        // queue.
        loadQueue();
      } else {
        // No photos were loaded. Display an error.
        handleError('Couldn\'t import album', 'Album is empty.');
      }
      hideLoadingDialog();
    },
    error: (data) => {
      handleError('Error trying to identify', data.message);
    }
  });
}

// Makes a backend request to display the queue of photos currently loaded into
// the photo frame. The backend returns a list of media items that the user has
// selected. They are rendered in showPreview(..).
function loadQueue() {
  showLoadingDialog();
  $.ajax({
    type: 'GET',
    url: '/getQueue',
    dataType: 'json',
    success: (data) => {
      // Queue has been loaded. Display the media items as a grid on screen.
      hideLoadingDialog();
      showPreview(data.parameters, data.photos);
      hideLoadingDialog();
      console.log('Loaded queue.');
    },
    error: (data) => {
      hideLoadingDialog();
      handleError('Could not load queue', data)
    }
  });
}

function identify(paramJSON) {
$.ajax({
  type: 'POST',
  url: '/identifyPlant',
  dataType: 'json',
  data: { paramJSON: paramJSON },
  success: (data) => {
    console.log('API hit');
    console.log(data);
    callToast('Successful identification');
  },
  error: (data) => {
    handleError('Couldn\'t import album', data);
    callToast('Error occurred: unsuccessful identification');
  }
});
}

// takes in a media item ID and hits the google photos API
// to get the rest of the info for the image
// TODO: this will probs be moved to another page
function getMediaItem(mediaItemID) {
$.ajax({
  type: 'POST',
  url: '/getMediaItem',
  dataType: 'json',
  data: { mediaItemID: mediaItemID },
  success: (data) => {
    console.log('Media Item Gotten, ', data);
  },
  error: (data) => {
    handleError('Couldn\'t import media item', data);
  }
});
}

function getIdentifiedForAlbum(albumId) {
$.ajax({
  type: 'POST',
  url: '/getAlbumIdentified',
  dataType: 'json',
  data: { albumId: albumId },
  success: (data) => {
    console.log('Album media Items Gotten, ', data[0]);
  },
  error: (data) => {
    handleError('Couldn\'t get identified info for this album', data);
  }
});
}

function callToast(message) {
  console.log("toast coming: " + message);
  var x = $('#id-toast');
  x.addClass("show");
  x.text(message)
  setTimeout(function(){ 
    x.removeClass("show")
    //x.className = x.className.replace("show", "toast show"); 
  }, 3000);
}

function displayOrganSelectors(selectedItems) {
  const organs = ["Leaf", "Flower", "Bark", "Fruit", "Other"];
  $('#organ-select-table').empty();
  $.each(selectedItems, (i, item) => {
    const tableRow = $('<tr />');

    const thumbnailUrl = `${item[0].url}=w128-h128`;
    const thumbnailImage = $('<img />')
                               .attr('src', thumbnailUrl)
                               .addClass('img-fluid rounded thumbnail')
                               .attr('style', "height: 128px;");
    tableRow.append(thumbnailImage);

    for (var i = 0; i < organs.length; i++) {
      const rowOption = $('<td />')
        .attr('style', "padding: 15px;");
      tableRow.append(rowOption);
      const label = $('<label />')
        .attr('class', "mdl-radio mdl-js-radio mdl-js-ripple-effect")
        .attr('for', "option_" + item[0].mediaID + "_" + i);
      rowOption.append(label);
      const input = $('<input />')
        .attr('type', "radio")
        .attr('id', "option_" + item[0].mediaID + "_" + i)
        .attr('name', "organ_" + item[0].mediaID)
        .attr('value', organs[i])
        .attr('class', "mdl-radio__button");
      label.append(input);
      const span = $('<span />')
        .attr('class', "mdl-radio__label")
        .text(organs[i]);
      label.append(span);
    }
    $('#organ-select-table').append(tableRow);
    componentHandler.upgradeDom();
  });
}

$(document).ready(() => {
  // Load the list of albums from the backend when the page is ready.
  displayAlbumList();
  var selectedItems = [];
  // Get the modal
  var modal = document.getElementById("organ-modal");
  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  $('#identification-albums').on('click', '.id-album-item', (event) => {
    console.log("Album target");
    console.log(event);
      const target = $(event.currentTarget);
      const albumId = target.attr('data-id');
      const albumTitle = target.attr('data-title');

      console.log('Importing album: ' + albumTitle);

      loadFromAlbum(albumTitle, albumId);
      selectedItems = [];
  });

  // Clicking on an image will add it to an array of selected items and display a checkmark over it.
  $('#images-container').on('click', '.id-media-item', (event) => {
    const target = $(event.currentTarget);
    const itemUrl = target.attr('data-base-url');
    const itemId = target.attr('data-media-id');

    const param =
      {
        url: itemUrl,
        organ: "flower",
        mediaID: itemId
      }

    console.log('ID of clicked: ', itemId);;
    var currCheck = document.getElementById('check_' + itemId);
    
    if (currCheck.classList.contains("image-check-unchecked")) {
      currCheck.classList.replace("image-check-unchecked", "image-check-checked");
      target.addClass("image-selected");
      selectedItems.push(param);
    } else if (currCheck.classList.contains("image-check-checked")) {
      currCheck.classList.replace("image-check-checked", "image-check-unchecked");
      target.removeClass("image-selected");
      selectedItems.splice(selectedItems.indexOf(param), 1);
    }
  })

  $('#id_button').on('click', (event) => {
    console.log("Selected item IDs: ");
    console.log(selectedItems);
    if (selectedItems.length > 0) {
      modal.style.display = "block";
      displayOrganSelectors(selectedItems);
    } else {
      alert("Select at least one photo to identify.");
    }
  });

  $('#send-button').on('click', (event) => {
    //check that each item has a selected organ (with at least one non-other), update JSON model, do identify() call
    var non_other = false;
    $.each(selectedItems, (i, item) => {
      const radio_options = document.querySelectorAll('input[name=organ_' + item[0].mediaID + ']');
      var selected = false;
      $.each(radio_options, (i, option) => {
        if (option.checked) {
          selected = true;
          if (option.value != "Other") {
            non_other = true;
          }
        }
      });
      if (!selected) {
        alert("Please select an organ for every photo.");
        return false;
      }
    });
    if (!non_other) {
      alert("At least one photo must be depicting a defined organ (not \"Other\")");
    }
    $.each(selectedItems, (i, item) => {
      const radio_options = document.querySelectorAll('input[name=organ_' + item[0].mediaID + ']');
      $.each(radio_options, (i, option) => {
        if (option.checked) {
          item[0].organ = option.value.toLowerCase();
        }
      });
    });
    console.log(selectedItems);
    callToast('Identification request sent');
    //identify(selectedItems);
    var selectedTargets = document.getElementsByClassName("image-check-checked");
    $.each(selectedTargets, (i, target) => {
      var t = $(target);
      t.classList.replace("image-check-checked", "image-check-unchecked");
    })
  });

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
});
