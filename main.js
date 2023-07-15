import React, { useState } from 'react';
import openai from 'openai';
import axios from 'axios';
import PyPDF2 from 'pdfjs-dist';
import docx from 'docxtemplater';

openai.api_key = "";

class CourseGenerator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      resume: null,
      summary: ''
    };
  }

  extractTextFromFile(file) {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const data = fileReader.result;
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (fileExtension === 'pdf') {
        const pdf = new Uint8Array(data);
        const doc = new PyPDF2.PdfReader(pdf);
        let extractedText = '';

        for (let i = 0; i < doc.numPages; i++) {
          const page = doc.getPage(i);
          extractedText += page.extractText();
        }

        this.setState({ summary: extractedText });
      } else if (fileExtension === 'txt') {
        const text = new TextDecoder().decode(data);
        this.setState({ summary: text });
      } else if (fileExtension === 'docx') {
        const doc = new docx(data);
        const text = doc.getFullText();
        this.setState({ summary: text });
      } else {
        this.setState({ summary: 'Unsupported file type' });
      }
    };

    fileReader.readAsArrayBuffer(file);
  }

  generateSummary() {
    const { resume } = this.state;
    if (resume) {
      const formData = new FormData();
      formData.append('resume', resume);

      axios.post('/api/extract-text', formData).then((response) => {
        const extractedText = response.data.text;

        const prompt = `Analyze the resume to write the summary for the following resume delimited by triple backticks.\n\`\`\`${extractedText}\n\`\`\``;

        openai.Completion.create({
          engine: 'text-davinci-003',
          prompt,
          max_tokens: 100,
          temperature: 0,
          n: 1,
          stop: null,
        }).then((response) => {
          const generatedText = response.choices[0].text.trim();
          this.setState({ summary: generatedText });
        });
      });
    }
  }

  handleFileChange(event) {
    const file = event.target.files[0];
    this.setState({ resume: file });
  }

  render() {
    const { summary } = this.state;

    return (
      <div>
        <h1>Resume Summarizer</h1>
        <input type="file" onChange={(event) => this.handleFileChange(event)} />
        <button onClick={() => this.generateSummary()}>Generate Summary</button>
        <div>{summary}</div>
      </div>
    );
  }
}

export default CourseGenerator;
