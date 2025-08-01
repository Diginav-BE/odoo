# -*- coding: utf-8 -*-

from odoo import http
from odoo.addons.http_routing.models.ir_http import unslug, slug
from odoo.http import request


class WebsitePartnerPage(http.Controller):

    # Do not use semantic controller due to SUPERUSER_ID
    @http.route(['/partners/<partner_id>'], type='http', auth="public", website=True)
    def partners_detail(self, partner_id, **post):
        current_slug = partner_id
        _, partner_id = unslug(partner_id)
        if partner_id:
            partner_sudo = request.env['res.partner'].sudo().browse(partner_id)
            is_website_restricted_editor = request.env['res.users'].has_group('website.group_website_restricted_editor')
            if partner_sudo.exists() and (partner_sudo.website_published or is_website_restricted_editor):
                if slug(partner_sudo) != current_slug:
                    return request.redirect('/partners/%s' % slug(partner_sudo))
                values = {
                    # See REVIEW_CAN_PUBLISH_UNSUDO
                    'main_object': partner_sudo.with_context(can_publish_unsudo_main_object=True),
                    'partner': partner_sudo,
                    'edit_page': False
                }
                return request.render("website_partner.partner_page", values)
        raise request.not_found()
