/* global instantsearch */

import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import dotenv from 'dotenv'

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    // 'xyz' for localhost
    apiKey: process.env.TYPESENSE_SEARCH_KEY, // Be sure to use an API key that only allows searches, in production
    nodes: [
      {
        host: 'hg7vkrslzm6cty9bp-1.a1.typesense.net', // 'localhost' || 'hg7vkrslzm6cty9bp-1.a1.typesense.net'
        port: '443', // 443 || 8108
        protocol: 'https', // https in prod
      },
    ],
  },
  // The following parameters are directly passed to Typesense's search API endpoint.
  //  So you can pass any parameters supported by the search endpoint below.
  //  queryBy is required.
  //  filterBy is managed and overridden by InstantSearch.js. To set it, you want to use one of the filter widgets like refinementList or use the `configure` widget.
  additionalSearchParameters: {
    queryBy: 'headline,content,author_name',
  },
});
const searchClient = typesenseInstantsearchAdapter.searchClient;

const search = instantsearch({
  searchClient,
  indexName: 'dataset1',
});

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: '#searchbox',
  }),
  instantsearch.widgets.configure({
    hitsPerPage: 12,
  }),
  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      item(item) {
        // console.log(43, item);
        return `
        <div>
          <div class="hit-name">
            ${item._highlightResult.headline.value}
            💬 ${item.comment_count}
          </div>
          <div class="hit-authors">
          ${item._highlightResult.pubname.value}
          </div>

          <div class="hit-publication-year">Published: ${new Date(
            item.pubdate
          ).toUTCString()}</div>
          <div class="hit-rating">Engage 🗣️: ${
            item.non_view_engagements
          }</div>
          <div class="hit-rating">Comments 💬: ${
            item.comment_count ? item.comment_count : 'NA'
          }</div>
          <div class="hit-rating">Likes 👍: ${
            item.like_count ? item.like_count : 'NA'
          }</div>
          <div class="hit-rating">Dislikes 👎: ${
            item.dislike_count ? item.dislike_count : 'NA'
          }</div>

          <div class="hit-content">
          ${item._highlightResult.content.value}
        </div>
        </div>
      `;
      },
    },
  }),
  instantsearch.widgets.pagination({
    container: '#pagination'
  }),
  instantsearch.widgets.clearRefinements({
    container: '#clear-refinements',
    templates: {
      resetLabel(hasRefinements) {
        return `<span>${hasRefinements ? 'Clear groups' : 'No groups'}</span>`;
      },
    },
  }),
  instantsearch.widgets.refinementList({
    container: '#refinement-list',
    attribute: 'pubname',
    templates: {
      item(item) {
        const { url, label, count, isRefined } = item;
        // console.log(88, item)
  
        return`
          <a href="${url}" style="${isRefined ? 'font-weight: bold' : ''}">
            <span>${label} (${count})</span>
          </a>
        `;
      },
    },
  }),
    instantsearch.widgets.sortBy({
      container: "#sort-by",
      items: [
        { label: "Default", value: "dataset1" },
        { label: "Engage 🗣️ (asc)", value: "dataset1/sort/non_view_engagements:asc" },
        { label: "Engage 🗣️ (desc)", value: "dataset1/sort/non_view_engagements:desc" },
        { label: "Comments 💬 (asc)", value: "dataset1/sort/comment_count:asc" },
        { label: "Comments 💬 (desc)", value: "dataset1/sort/comment_count:desc" },
        { label: "Likes 👍 (asc)", value: "dataset1/sort/like_count:asc" },
        { label: "Likes 👍 (desc)", value: "dataset1/sort/like_count:desc" },
        { label: "Dislikes 👎 (asc)", value: "dataset1/sort/dislike_count:asc" },
        { label: "Dislikes 👎 (desc)", value: "dataset1/sort/dislike_count:desc" },
      ],
    }),
  instantsearch.widgets.stats({
    container: '#stats',
    templates: {
      text(data) {
        // console.log(80, data);
        return `
        <div>
          <div class="hit-stats">${data.nbHits} results found in ${data.processingTimeMS}ms.</div>
        </div>`;
      },
    },
  }),
]);

search.start();
