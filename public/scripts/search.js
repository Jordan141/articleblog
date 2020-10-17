$('#article-search').on('input', function() {
    var search = $(this).serialize();
    if(search === "search=") {
      search = "all"
    }
    $.get('/articles?' + search, function(data) {
      $('#article-grid').html('');
      data.forEach(function(article) {
        $('#article-grid').append(`
          <div class="col-md-3 col-sm-6">
            <div class="thumbnail">
              <div class="caption">
                <h4>${ article.title }</h4>
              </div>
              <p>
                <a href="/articles/${ article._id }" class="btn btn-primary">More Info</a>
              </p>
            </div>
          </div>
        `);
      });
    });
  });
  
  $('#article-search').submit(function(event) {
    event.preventDefault();
  });