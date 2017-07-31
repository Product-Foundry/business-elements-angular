/* global Defiant:false */

export default class ParsingService {
  constructor() {
  }

  $get() {
    return new ParsingService();
  }

  parseContent(content) {
    return content.children.reduce((acc, context) => {
      const frameName = context.element.content.data.value;
      const frameData = context.children.reduce((childAcc, contextFrame) => {
        childAcc.push(this.getFrameData(contextFrame));
        return childAcc;
      }, []);
      acc.set(frameName, frameData);
      return acc;
    }, new Map());
  }

  getContentItems(sectionsArray, maxItems = null, itemCount = 0) {
    return sectionsArray.reduce((acc, sectionElement) => {
      if (sectionElement.children) {
        acc = acc.concat(this.convertToSectionItems(sectionElement.children));
      }

      if (this.hasChildSections(sectionElement) && (maxItems === null || itemCount <= maxItems)) {
        return acc.concat(this.getContentItems([].concat(sectionElement.children), maxItems, acc.length));
      } else {
        return acc;
      }
    }, []);
  }

  convertToSectionItems(contentElementsArray) {
    return contentElementsArray.reduce((acc, contentElement) => {
      if (contentElement.item.type === "Content") {
        const sectionItem = {
          id: contentElement.item.data.contentId.data.valueCellId,
          title: contentElement.item.data.title,
          url: contentElement.url
        };
        acc.push(sectionItem);
      }
      return acc;
    }, []);
  }

  hasChildSections(sectionElement) {
    return angular.isDefined(sectionElement.children.find((sectionChild) => {
      return (sectionChild.item.type === "Classification");
    }));
  }

  getFrameData(contextFrame) {
    const preparedContentFrame = Defiant.getSnapshot(contextFrame);

    let contentChapter, contentIntro, contentId, contentParagraphs = [];
    const paragraphs = [];
    const title = this.getFirstArrayValue(JSON.search(preparedContentFrame, '(//*[attribute]/value/title | //*[attribute="name"]/value/name)[1]'));
    const type = this.getFirstArrayValue(JSON.search(preparedContentFrame, '(//*[attribute]/attribute)[1]'));
    const classification = this.getFirstArrayValue(contextFrame.element.classifications);
    const contentMaturity = this.getFirstArrayValue(JSON.search(preparedContentFrame, '(//*[attribute="pattern"]/value/maturity)[1]'));

    if (contextFrame.element.id.data.valueCellId) {
      contentId = contextFrame.element.id.data.valueCellId;
      contentParagraphs = JSON.search(preparedContentFrame, '//*[contentType="Section"]/..');
    } else if (contextFrame.element.id.data.instanceCellId) {
      contentId = contextFrame.element.id.data.instanceCellId;
      contentParagraphs = JSON.search(preparedContentFrame, '//*[contentType="Section"]/..')[0].children;
    }

    const contentCandidate = this.getFirstArrayValue(JSON.search(preparedContentFrame, '(//element//*[attribute="pattern"]/../.. | //element//*[attribute="story"]/../.. | //element//*[attribute="force"]/../.. | //element//*[attribute="solution"]/../..)[1]'));

    if (contentCandidate) {
      contentIntro = this.getFirstArrayValue(JSON.search(contentCandidate, '(//content//value/pattern | //content//value/story | //content//value/force | //content//value/solution)[1]'));
      contentChapter = this.getFirstArrayValue(JSON.search(contentCandidate, '(//content//value/title)[1]'));
      //filter out valueId (paragraph), its already collected in /content/intro & /content/chapter
      contentParagraphs = contentParagraphs.filter((paragraph) => {
        return (JSON.search(paragraph, '//*[valueId="' + contentCandidate.id.data.valueId + '"]')).length === 0;
      });
    }

    const contentImage = this.getFirstArrayValue(JSON.search(preparedContentFrame, '(//*[attribute="image"]/value/href)[1]'));
    if (contentImage && contentImage.length > 0) {
      //filter first image already collected in /content/img
      contentParagraphs = contentParagraphs.filter((paragraph) => {
        if (paragraph.element.id.type === "ValueCell" && paragraph.children.length > 0) {
          return paragraph.children[0].element.content.data.value.href !== contentImage;
        } else if (paragraph.element.id.type === "Value") {
          return paragraph.element.content.data.value.href !== contentImage;
        } else {
          return true;
        }
      });
    }

    if (contentParagraphs.indexOf(undefined) === -1 && contentParagraphs.length > 0) {
      contentParagraphs.forEach((paragraph) => {
        const data = JSON.search(paragraph, '//*[contentType="Component"]/content/data');
        if (data.length > 1) {
          data[0].value.sidenote = data[1].value.description;
        }
        if (data[0]) {
          paragraphs.push(data[0]);
        }
      });
    } else {
      // no paragraphs found; add placeholder data.
      paragraphs.push({
        "attribute": "description",
        "value": {
          "description": "*Content coming soon...*"
        }
      });
    }

    return {
      // TODO - store as card ID the entire serialized element.id field
      id: ParsingService.getValueOrDefault(contentId),
      type: ParsingService.getValueOrDefault(type),
      description: ParsingService.getValueOrDefault(title),
      classification: ParsingService.getValueOrDefault(classification),
      content: {
        maturity: ParsingService.getValueOrDefault(contentMaturity),
        title: ParsingService.getValueOrDefault(title),
        intro: ParsingService.getValueOrDefault(contentIntro),
        chapter: ParsingService.getValueOrDefault(contentChapter),
        type: ParsingService.getValueOrDefault(type),
        img: ParsingService.getValueOrDefault(contentImage),
        paragraphs: paragraphs
      }
    };
  }

  /**
   * From the provided parsedContent, find all patterns in paragraph and in contentItems and store the contentId and title.
   *
   * @param parsedContent the content in which patterns are looked for.
   * @constructUrlFn a function reference to construct an url using the content-title.
   */
  findPatterns(parsedContent) {
    const valueType = "pattern";
    const contentArray = Array.from(parsedContent.values());
    return contentArray[0].reduce((acc, value) => {
      if (value.type === valueType) {
        acc.push({
          contentId: value.id,
          pattern: value.description
        });
      }

      if (value.content && value.content.paragraphs && value.content.paragraphs.length > 0) {
        value.content.paragraphs.reduce((parAcc, par) => {
          if (par.attribute === valueType) {
            parAcc.push({
              contentId: value.id,
              pattern: par.value.title
            });
          }
          return parAcc;
        }, acc);
      }
      return acc;
    }, []);
  }

  static getValueOrDefault(value, defaultValue) {
    return (value) || (defaultValue || "");
  }

  getFirstArrayValue(arrayValues) {
    return angular.isArray(arrayValues) && arrayValues[0];
  }

}
