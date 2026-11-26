import { inject, bindable } from 'aurelia-framework';
import { Service, CoreService } from "./service";
import { Router } from 'aurelia-router';
import { AuthService } from "aurelia-authentication";
import moment from 'moment';
import { Base64Helper } from '../../../utils/base-64-coded-helper';

@inject(Router, Service, CoreService, AuthService)
export class List {
    //@bindable section;

    context = ["Detail"]

    columns = [
        { field: "packingListNo", title: "No Packing List" },
        { field: "invoiceType", title: "Jenis Invoice" },
        {
            field: "date", title: "Tgl Packing List", formatter: function (value, data, index) {
                return moment(value).format("DD MMM YYYY");
            }
        },
        { field: "SectionCode", title: "Seksi" },
        { field: "BuyerAgentName", title: "Buyer Agent" },
        { field: "destination", title: "Destination" },
    ];

    loader = (info) => {
        var order = {};
        if (info.sort)
            order[info.sort] = info.order;

        let username = null;
        if (this.authService.authenticated) {
            const me = this.authService.getTokenPayload();
            username = me.username;
        }

        var arg = {
            page: parseInt(info.offset / info.limit, 10) + 1,
            size: info.limit,
            keyword: info.search,
            order: order,
            filter: JSON.stringify({ 
                Status: "POSTED", 
                MdStaffName: username,
                //SectionCode: this.section,
                "(IsFile != \"false\")":true
            })
        }

        return this.service.search(arg)
            .then(result => {
                for (const data of result.data) {
                    data.SectionCode = data.section.code;
                    data.BuyerAgentName = data.buyerAgent.name;
                }

                return {
                    total: result.info.total,
                    data: result.data
                }
            });
    }

    constructor(router, service, coreService, authService) {
        this.service = service;
        this.router = router;
        this.coreService = coreService;
        this.authService = authService;
    }

    async activate() {
        let sectionResult = await this.coreService.getSections();
        this.SectionOptions = sectionResult.data.map(d => d.Code);
        this.SectionOptions.unshift("Pilih Seksi");
    }

    contextClickCallback(event) {
        var arg = event.detail;
        var data = arg.data;
        switch (arg.name) {
            case "Detail":
                const encoded = Base64Helper.encode(data.id);
                this.router.navigateToRoute('view', { id: encoded });
                break;
        }
    }

    // sectionChanged() {
    //     if (this.table) {
    //         this.table.refresh();
    //     }
    // }

    create() {
        this.router.navigateToRoute('create');
    }
}
