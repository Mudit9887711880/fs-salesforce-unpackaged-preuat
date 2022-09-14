import { LightningElement, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
export default class PcCarousalView extends NavigationMixin(LightningElement) {

    @track slideIndex = 1;
    @api imgList;

    connectedCallback() {
        console.log('carousal img list>>>>> ', this.imgList);
        console.log('called from >>>> ', this.calledFrom)
    }
    
    leftAction(event) {
        this.slideIndex = this.slideIndex - 1;
        this.showSlides(this.slideIndex);
    }

    rightAction(event) {
        this.slideIndex = this.slideIndex + 1;
        this.showSlides(this.slideIndex);
    }

    showSlides(n) {
        let i;
        let slides = this.template.querySelectorAll(".imagecarousal>img");
        // let slides=this.imgList.size();
        if (n > slides.length) {
            this.slideIndex = 1
        }
        if (n < 1) {
            this.slideIndex = slides.length
        }
        slides.forEach(i => {
            i.style.display = "none";
        });
        slides[this.slideIndex - 1].style.display = "block";
    }




    navigateToFiles(event) {
        console.log('navigate called' + event.target.dataset.id);
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                recordIds: event.target.dataset.id
            }
        });
    }
}