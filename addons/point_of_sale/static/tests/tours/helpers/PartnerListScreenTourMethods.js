odoo.define('point_of_sale.tour.PartnerListScreenTourMethods', function (require) {
    'use strict';

    const { createTourMethods } = require('point_of_sale.tour.utils');

    class Do {
        clickPartner(name) {
            return [
                {
                    content: `click partner '${name}' from partner list screen`,
                    trigger: `.partnerlist-screen .partner-list-contents .partner-line td:contains("${name}")`,
                },
            ];
        }
        clickPartnerDetailsButton(name) {
            return [
                {
                    content: `click partner details '${name}' from partner list screen`,
                    trigger: `.partner-line:contains('${name}') .edit-partner-button`,
                }
            ]
        }
        clickBack() {
            return [
                {
                    trigger: ".partnerlist-screen .button.back",
                },
            ];
        }
    }

    class Check {
        isShown() {
            return [
                {
                    content: 'partner list screen is shown',
                    trigger: '.pos-content .partnerlist-screen',
                    run: () => {},
                },
            ];
        }
    }

    class Execute {}

    return createTourMethods('PartnerListScreen', Do, Check, Execute);
});
